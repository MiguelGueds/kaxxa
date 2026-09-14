import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const ALLOWED_TABLES = new Set([
  'investments',
  'accounts',
  'credit_cards',
  'debts',
  'amortizations',
  'transactions',
  'third_parties',
  'third_party_debts',
  'categories',
  'subscriptions',
]);

const UNIFIED_USER_IDS = ['b0a91108-2b2f-4e43-86a8-260969705b7f', 'b141c1ba-97c9-4b20-a662-aedeb4b38acd'];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, table, payload, id, filters } = body;

    if (!table || !ALLOWED_TABLES.has(table)) {
      return NextResponse.json({ error: 'Tabela inválida ou não permitida.' }, { status: 400 });
    }

    const client = supabaseAdmin || supabase;

    // Normaliza user_id se for um dos IDs conhecidos de Miguel
    let safePayload = payload;
    if (safePayload && typeof safePayload === 'object' && safePayload.user_id) {
      if (UNIFIED_USER_IDS.includes(safePayload.user_id)) {
        safePayload.user_id = 'b0a91108-2b2f-4e43-86a8-260969705b7f';
      }
    }

    if (action === 'insert') {
      const { data, error } = await client.from(table).insert(safePayload).select().single();
      if (error) {
        return NextResponse.json({ error: error.message, details: error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data });
    }

    if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'ID é obrigatório para atualização.' }, { status: 400 });
      }
      const { data, error } = await client.from(table).update(safePayload).eq('id', id).select();
      if (error) {
        return NextResponse.json({ error: error.message, details: error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data });
    }

    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'ID é obrigatório para exclusão.' }, { status: 400 });
      }
      const { error } = await client.from(table).delete().eq('id', id);
      if (error) {
        return NextResponse.json({ error: error.message, details: error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'select') {
      let query = client.from(table).select('*');
      if (filters?.user_id) {
        const targetId = filters.user_id === 'b141c1ba-97c9-4b20-a662-aedeb4b38acd'
          ? 'b0a91108-2b2f-4e43-86a8-260969705b7f'
          : filters.user_id;
        query = query.eq('user_id', targetId);
      }
      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ error: error.message, details: error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: 'Ação desconhecida.' }, { status: 400 });
  } catch (err: any) {
    console.error('Erro na rota /api/db:', err);
    return NextResponse.json({ error: err.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}

