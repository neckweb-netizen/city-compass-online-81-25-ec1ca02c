import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type Medicamento = { id:string; nome:string; dose:string; instrucoes:string; dataInicio:string; dataFim:string|null; ativo:boolean; estoqueAtual:number|null; estoqueMinimo:number|null };
export type HorarioMedicamento = { id:string; medicamentoId:string; hora:string; diasSemana:number[]; notificar:boolean };
export type DoseMedicamento = { id:string; medicamentoId:string; horarioId:string|null; previstaPara:string; status:'tomada'|'ignorada'; registradaEm:string };
type State={medicamentos:Medicamento[];horarios:HorarioMedicamento[];doses:DoseMedicamento[]};
const KEY='sajtem:medicamentos:v1'; const empty:State={medicamentos:[],horarios:[],doses:[]};
const local=():State=>{try{const p=JSON.parse(localStorage.getItem(KEY)||'null');return p?{medicamentos:p.medicamentos||[],horarios:p.horarios||[],doses:p.doses||[]}:empty}catch{return empty}};

export const useMedicamentosStorage=()=>{
 const {user,loading:authLoading}=useAuth(); const [state,setState]=useState<State>(local); const [loading,setLoading]=useState(true); const [syncing,setSyncing]=useState(false); const [syncError,setSyncError]=useState<string|null>(null);
 const persist=useCallback((n:State)=>{setState(n);try{localStorage.setItem(KEY,JSON.stringify(n))}catch{}},[]);
 const reload=useCallback(async()=>{if(!user){setState(local());setLoading(false);return} setLoading(true);setSyncError(null);
  const [m,h,d]=await Promise.all([(supabase as any).from('medicamentos_usuario').select('*').eq('user_id',user.id).order('criado_em'),(supabase as any).from('medicamento_horarios').select('*').eq('user_id',user.id).order('hora'),(supabase as any).from('medicamento_doses').select('*').eq('user_id',user.id).order('prevista_para',{ascending:false}).limit(300)]);
  const e=m.error||h.error||d.error;if(e){setSyncError(e.message);setLoading(false);return}
  persist({medicamentos:(m.data||[]).map((r:any)=>({id:r.id,nome:r.nome,dose:r.dose||'',instrucoes:r.instrucoes||'',dataInicio:r.data_inicio,dataFim:r.data_fim,ativo:r.ativo,estoqueAtual:r.estoque_atual==null?null:Number(r.estoque_atual),estoqueMinimo:r.estoque_minimo==null?null:Number(r.estoque_minimo)})),horarios:(h.data||[]).map((r:any)=>({id:r.id,medicamentoId:r.medicamento_id,hora:String(r.hora).slice(0,5),diasSemana:r.dias_semana||[0,1,2,3,4,5,6],notificar:r.notificar})),doses:(d.data||[]).map((r:any)=>({id:r.id,medicamentoId:r.medicamento_id,horarioId:r.horario_id,previstaPara:r.prevista_para,status:r.status,registradaEm:r.registrada_em}))});setLoading(false)
 },[persist,user]);
 useEffect(()=>{if(!authLoading)void reload()},[authLoading,reload]);
 const saveMedicamento=useCallback(async(med:Medicamento,hs:HorarioMedicamento[])=>{const prev=state;persist({...state,medicamentos:state.medicamentos.some(x=>x.id===med.id)?state.medicamentos.map(x=>x.id===med.id?med:x):[...state.medicamentos,med],horarios:[...state.horarios.filter(x=>x.medicamentoId!==med.id),...hs]});if(!user)return{synced:false as const,reason:'not_authenticated' as const};setSyncing(true);setSyncError(null);
  const {error}=await(supabase as any).from('medicamentos_usuario').upsert({id:med.id,user_id:user.id,nome:med.nome,dose:med.dose||null,instrucoes:med.instrucoes||null,data_inicio:med.dataInicio,data_fim:med.dataFim||null,ativo:med.ativo,estoque_atual:med.estoqueAtual,estoque_minimo:med.estoqueMinimo},{onConflict:'id'});if(error){persist(prev);setSyncError(error.message);setSyncing(false);return{synced:false as const,reason:'remote_error' as const,error}}
  const del=await(supabase as any).from('medicamento_horarios').delete().eq('user_id',user.id).eq('medicamento_id',med.id);if(del.error){setSyncError(del.error.message);setSyncing(false);return{synced:false as const,reason:'remote_error' as const,error:del.error}}
  if(hs.length){const ins=await(supabase as any).from('medicamento_horarios').insert(hs.map(x=>({id:x.id,user_id:user.id,medicamento_id:med.id,hora:x.hora,dias_semana:x.diasSemana,notificar:x.notificar})));if(ins.error){setSyncError(ins.error.message);setSyncing(false);return{synced:false as const,reason:'remote_error' as const,error:ins.error}}}setSyncing(false);await reload();return{synced:true as const}
 },[persist,reload,state,user]);
 const removeMedicamento=useCallback(async(id:string)=>{persist({medicamentos:state.medicamentos.filter(x=>x.id!==id),horarios:state.horarios.filter(x=>x.medicamentoId!==id),doses:state.doses.filter(x=>x.medicamentoId!==id)});if(user){const r=await(supabase as any).from('medicamentos_usuario').delete().eq('id',id).eq('user_id',user.id);if(r.error)setSyncError(r.error.message)}},[persist,state,user]);
 const registrarDose=useCallback(async(medicamentoId:string,horarioId:string|null,previstaPara:string,status:'tomada'|'ignorada')=>{const dose={id:crypto.randomUUID(),medicamentoId,horarioId,previstaPara,status,registradaEm:new Date().toISOString()};persist({...state,doses:[dose,...state.doses].slice(0,300)});if(user){const r=await(supabase as any).from('medicamento_doses').insert({id:dose.id,user_id:user.id,medicamento_id:medicamentoId,horario_id:horarioId,prevista_para:previstaPara,status,registrada_em:dose.registradaEm});if(r.error)setSyncError(r.error.message)}},[persist,state,user]);
 const storageLabel=useMemo(()=>authLoading||loading?'Carregando':!user?'Salvo neste aparelho':syncing?'Sincronizando':syncError?'Sincronização pendente':'Sincronizado na conta',[authLoading,loading,syncError,syncing,user]);
 return{...state,user,loading:authLoading||loading,syncing,syncError,storageLabel,saveMedicamento,removeMedicamento,registrarDose,reload};
};

