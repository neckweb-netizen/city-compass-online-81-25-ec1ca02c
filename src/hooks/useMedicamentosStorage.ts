import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type Medicamento = { id:string; nome:string; dose:string; instrucoes:string; dataInicio:string; dataFim:string|null; ativo:boolean; estoqueAtual:number|null; estoqueMinimo:number|null };
export type HorarioMedicamento = { id:string; medicamentoId:string; hora:string; diasSemana:number[]; notificar:boolean };
export type DoseMedicamento = { id:string; medicamentoId:string; horarioId:string|null; previstaPara:string; status:'tomada'|'ignorada'; registradaEm:string };
type State = { medicamentos:Medicamento[]; horarios:HorarioMedicamento[]; doses:DoseMedicamento[] };
const KEY='sajtem:medicamentos:v1';
const empty:State={medicamentos:[],horarios:[],doses:[]};
const keyFor = (id?:string) => id ? `${KEY}:user:${id}` : KEY;
const readLocal=(key:string):State=>{
  try {
    const p=JSON.parse(localStorage.getItem(key)||'null');
    return p ? {
      medicamentos:Array.isArray(p.medicamentos)?p.medicamentos:[],
      horarios:Array.isArray(p.horarios)?p.horarios:[],
      doses:Array.isArray(p.doses)?p.doses:[]
    } : empty;
  } catch { return empty; }
};

export const useMedicamentosStorage=()=>{
  const {user,loading:authLoading}=useAuth();
  const [state,setState]=useState<State>(empty);
  const [stateAccountId,setStateAccountId]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [syncing,setSyncing]=useState(false);
  const [syncError,setSyncError]=useState<string|null>(null);
  const activeAccountRef=useRef(user?.id??null);
  activeAccountRef.current=user?.id??null;
  const requestRef=useRef(0);
  const mutationRef=useRef(false);
  const persist=useCallback((next:State,accountId:string|null)=>{
    if(activeAccountRef.current!==accountId)return;
    setState(next);setStateAccountId(accountId);
    try{localStorage.setItem(keyFor(accountId??undefined),JSON.stringify(next))}catch{}
  },[]);

  const reload=useCallback(async()=>{
    const request=++requestRef.current;
    const accountId=user?.id??null;
    setLoading(true);setSyncError(null);
    setStateAccountId(accountId);
    setState(readLocal(keyFor(accountId??undefined)));
    if(!accountId){setLoading(false);return;}
    try{
      const [m,h,d]=await Promise.all([
        (supabase as any).from('medicamentos_usuario').select('*').eq('user_id',accountId).order('criado_em'),
        (supabase as any).from('medicamento_horarios').select('*').eq('user_id',accountId).order('hora'),
        (supabase as any).from('medicamento_doses').select('*').eq('user_id',accountId).order('prevista_para',{ascending:false}).limit(300),
      ]);
      if(request!==requestRef.current||activeAccountRef.current!==accountId)return;
      const error=m.error||h.error||d.error;
      if(error){setSyncError(error.message);return;}
      persist({
        medicamentos:(m.data||[]).map((r:any)=>({id:r.id,nome:r.nome,dose:r.dose||'',instrucoes:r.instrucoes||'',dataInicio:r.data_inicio,dataFim:r.data_fim,ativo:r.ativo,estoqueAtual:r.estoque_atual==null?null:Number(r.estoque_atual),estoqueMinimo:r.estoque_minimo==null?null:Number(r.estoque_minimo)})),
        horarios:(h.data||[]).map((r:any)=>({id:r.id,medicamentoId:r.medicamento_id,hora:String(r.hora).slice(0,5),diasSemana:r.dias_semana||[0,1,2,3,4,5,6],notificar:r.notificar})),
        doses:(d.data||[]).map((r:any)=>({id:r.id,medicamentoId:r.medicamento_id,horarioId:r.horario_id,previstaPara:r.prevista_para,status:r.status,registradaEm:r.registrada_em})),
      },accountId);
    }catch(cause){
      if(request===requestRef.current&&activeAccountRef.current===accountId)
        setSyncError(cause instanceof Error?cause.message:'Erro ao carregar medicamentos.');
    }finally{
      if(request===requestRef.current&&activeAccountRef.current===accountId)setLoading(false);
    }
  },[persist,user?.id]);

  useEffect(()=>{
    if(authLoading){
      ++requestRef.current;
      setState(empty);setStateAccountId(null);setLoading(true);
      return;
    }
    void reload();
    return()=>{++requestRef.current};
  },[authLoading,reload]);

  const blocked=()=>({synced:false as const,reason:'remote_error' as const,
    error:{message:'Aguarde a operação atual ou o carregamento dos medicamentos.'}});
  const mutate=useCallback(async(next:State,operation:(accountId:string)=>Promise<{error:{message:string}|null}>)=>{
    if(authLoading||loading||mutationRef.current||stateAccountId!==(user?.id??null))return blocked();
    const accountId=user?.id??null;
    if(!accountId){
      persist(next,null);
      return{synced:false as const,reason:'not_authenticated' as const};
    }
    mutationRef.current=true;setSyncing(true);setSyncError(null);
    try{
      const {error}=await operation(accountId);
      if(error){
        if(activeAccountRef.current===accountId)setSyncError(error.message);
        return{synced:false as const,reason:'remote_error' as const,error};
      }
      if(activeAccountRef.current!==accountId)return{synced:false as const,reason:'remote_error' as const,
        error:{message:'A conta foi alterada. Atualize os medicamentos.'}};
      persist(next,accountId);
      return{synced:true as const};
    }catch(cause){
      const error={message:cause instanceof Error?cause.message:'Falha na sincronização dos medicamentos.'};
      if(activeAccountRef.current===accountId)setSyncError(error.message);
      return{synced:false as const,reason:'remote_error' as const,error};
    }finally{
      mutationRef.current=false;
      if(activeAccountRef.current===accountId)setSyncing(false);
    }
  },[authLoading,loading,persist,stateAccountId,user?.id]);

  const saveMedicamento=useCallback(async(med:Medicamento,hs:HorarioMedicamento[])=>{
    const next={...state,
      medicamentos:state.medicamentos.some(x=>x.id===med.id)?state.medicamentos.map(x=>x.id===med.id?med:x):[...state.medicamentos,med],
      horarios:[...state.horarios.filter(x=>x.medicamentoId!==med.id),...hs],
    };
    return mutate(next,async()=>{
      const {error}=await supabase.rpc('save_medicine_with_schedule' as any,{
        p_medicine:med,p_schedules:hs,
      });
      return{error};
    });
  },[mutate,state]);

  const removeMedicamento=useCallback(async(id:string)=>mutate({
    medicamentos:state.medicamentos.filter(x=>x.id!==id),
    horarios:state.horarios.filter(x=>x.medicamentoId!==id),
    doses:state.doses.filter(x=>x.medicamentoId!==id),
  },accountId=>(supabase as any).from('medicamentos_usuario').delete().eq('id',id).eq('user_id',accountId)),
  [mutate,state]);

  const registrarDose=useCallback(async(medicamentoId:string,horarioId:string|null,previstaPara:string,status:'tomada'|'ignorada')=>{
    const previous=state.doses.find(d=>d.medicamentoId===medicamentoId&&d.horarioId===horarioId&&d.previstaPara===previstaPara);
    if(previous)return{synced:false as const,reason:'remote_error' as const,
      error:{message:'Este horário já possui uma dose registrada.'}};
    const dose:DoseMedicamento={id:crypto.randomUUID(),medicamentoId,horarioId,previstaPara,status,registradaEm:new Date().toISOString()};
    return mutate({...state,doses:[dose,...state.doses].slice(0,300)},accountId=>(supabase as any)
      .from('medicamento_doses').insert({id:dose.id,user_id:accountId,medicamento_id:medicamentoId,
        horario_id:horarioId,prevista_para:previstaPara,status,registrada_em:dose.registradaEm}));
  },[mutate,state]);

  const storageLabel=useMemo(()=>authLoading||loading?'Carregando':!user?'Salvo neste aparelho':syncing?'Sincronizando':syncError?'Falha ao sincronizar':'Sincronizado na conta',[authLoading,loading,syncError,syncing,user]);
  const visible=stateAccountId===(user?.id??null)?state:empty;
  return{...visible,user,loading:authLoading||loading||stateAccountId!==(user?.id??null),
    syncing,syncError,storageLabel,saveMedicamento,removeMedicamento,registrarDose,reload};
};
