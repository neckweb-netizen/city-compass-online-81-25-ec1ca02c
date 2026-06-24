import React from 'react';
import { useParams } from 'react-router-dom';
import { EventoDetailContent } from '@/components/eventos/EventoDetailContent';

export default function EventoPage() {
  const { id } = useParams<{ id: string }>();

  return <EventoDetailContent eventoId={id} />;
}