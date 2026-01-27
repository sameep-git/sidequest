import { supabase } from './supabase';
import type {
  DebtLedger,
  Household,
  HouseholdMember,
  ShoppingItem,
  Transaction,
  TransactionItem,
  User
} from './types';

export type HouseholdMemberProfile = {
  member: HouseholdMember;
  profile: Pick<User, 'id' | 'email' | 'display_name' | 'venmo_handle' | 'avatar_url'> | null;
};

export const householdService = {
  async create(
    name: string,
    creatorUserId: string
  ): Promise<{ household: Household; membership: HouseholdMember }> {
    // Generate a 6-digit join code
    const joinCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create household
    const { data: household, error: householdError } = await supabase
      .from('households')
      .insert({ name, join_code: joinCode })
      .select()
      .single();

    if (householdError) throw householdError;

    // Add creator as admin
    const { data: membership, error: memberError } = await supabase
      .from('household_members')
      .insert({
        household_id: household.id,
        user_id: creatorUserId,
        role: 'admin',
      })
      .select()
      .single();

    if (memberError) throw memberError;

    return {
      household,
      membership,
    };
  },

  async joinByCode(
    joinCode: string,
    userId: string
  ): Promise<{ household: Household; membership: HouseholdMember }> {
    // Find household by join code
    const { data: household, error: householdError } = await supabase
      .from('households')
      .select()
      .eq('join_code', joinCode)
      .single();

    if (householdError) throw householdError;
    if (!household) throw new Error('Invalid join code');

    // Check if already a member
    const { data: existing } = await supabase
      .from('household_members')
      .select()
      .eq('household_id', household.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return { household, membership: existing };
    }

    // Add as member
    const { data: membership, error: memberError } = await supabase
      .from('household_members')
      .insert({
        household_id: household.id,
        user_id: userId,
        role: 'member',
      })
      .select()
      .single();

    if (memberError) throw memberError;

    return { household, membership };
  },

  async getPrimaryHouseholdForUser(
    userId: string
  ): Promise<{ household: Household; membership: HouseholdMember } | null> {
    const { data, error } = await supabase
      .from('household_members')
      .select(
        `role, household_id, user_id, joined_at,
         households:households (id, name, join_code, created_at)`
      )
      .eq('user_id', userId)
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data || !data.households) return null;

    const householdRecord = Array.isArray(data.households)
      ? data.households[0]
      : data.households;
    if (!householdRecord) return null;

    const household: Household = {
      id: householdRecord.id,
      name: householdRecord.name,
      join_code: householdRecord.join_code,
      created_at: householdRecord.created_at,
    };

    const membership: HouseholdMember = {
      household_id: data.household_id,
      user_id: userId,
      role: data.role,
      joined_at: data.joined_at,
    };

    return { household, membership };
  },

  async getMembers(householdId: string): Promise<HouseholdMemberProfile[]> {
    const { data, error } = await supabase
      .from('household_members')
      .select(
        `role, household_id, user_id, joined_at,
         users:users (id, email, display_name, venmo_handle, avatar_url)`
      )
      .eq('household_id', householdId);

    if (error) throw error;

    return (data || []).map((row) => {
      const userProfile = Array.isArray(row.users) ? row.users[0] : row.users;
      return {
        member: {
          household_id: row.household_id,
          user_id: row.user_id,
          role: row.role,
          joined_at: row.joined_at,
        },
        profile: userProfile
          ? {
            id: userProfile.id,
            email: userProfile.email,
            display_name: userProfile.display_name,
            avatar_url: userProfile.avatar_url,
            venmo_handle: userProfile.venmo_handle,
          }
          : null,
      };
    });
  },

  async leave(householdId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('household_members')
      .delete()
      .eq('household_id', householdId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};

export const shoppingService = {
  async list(householdId: string): Promise<ShoppingItem[]> {
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(
    item: Omit<ShoppingItem, 'id' | 'created_at' | 'purchased_at' | 'purchased_by'>
  ): Promise<ShoppingItem> {
    const { data, error } = await supabase
      .from('shopping_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(
    id: string,
    status: 'pending' | 'purchased',
    purchaserId?: string | null
  ): Promise<ShoppingItem> {
    const payload: Partial<ShoppingItem> = { status };
    if (status === 'purchased') {
      payload.purchased_by = purchaserId ?? null;
      payload.purchased_at = new Date().toISOString();
    } else {
      payload.purchased_by = null;
      payload.purchased_at = null;
    }

    const { data, error } = await supabase
      .from('shopping_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('shopping_items').delete().eq('id', id);
    if (error) throw error;
  },
};

export const transactionService = {
  async create(
    transaction: Omit<Transaction, 'id' | 'created_at'>
  ): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createItems(items: Omit<TransactionItem, 'id' | 'created_at'>[]): Promise<void> {
    const { error } = await supabase.from('transaction_items').insert(items);
    if (error) throw error;
  },

  async listByUser(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('payer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async listByHousehold(householdId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getItems(transactionId: string): Promise<TransactionItem[]> {
    const { data, error } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', transactionId);

    if (error) throw error;
    return data || [];
  },
};

export const userService = {
  async upsert(user: Omit<User, 'created_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .upsert(user, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },
};

export const debtService = {
  async listHouseholdDebts(householdId: string): Promise<DebtLedger[]> {
    const { data, error } = await supabase
      .from('debt_ledger')
      .select('*, transactions!inner(household_id)')
      .eq('transactions.household_id', householdId)
      .eq('is_settled', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(({ transactions, ...rest }) => rest as DebtLedger);
  },

  async listByUser(userId: string): Promise<DebtLedger[]> {
    const { data, error } = await supabase
      .from('debt_ledger')
      .select('*')
      .or(`borrower_id.eq.${userId},lender_id.eq.${userId}`)
      .eq('is_settled', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createMany(entries: Array<Omit<DebtLedger, 'id' | 'created_at'>>): Promise<DebtLedger[]> {
    if (entries.length === 0) return [];

    const { data, error } = await supabase
      .from('debt_ledger')
      .insert(entries)
      .select();

    if (error) throw error;
    return data || [];
  },

  async settleDebt(id: string): Promise<void> {
    const { error } = await supabase
      .from('debt_ledger')
      .update({ is_settled: true })
      .eq('id', id);

    if (error) throw error;
  },

  async settleAllDebts(borrowerId: string, lenderId: string): Promise<void> {
    const { error } = await supabase
      .from('debt_ledger')
      .update({ is_settled: true })
      .eq('borrower_id', borrowerId)
      .eq('lender_id', lenderId)
      .eq('is_settled', false);

    if (error) throw error;
  },
};
