import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iqxalqtjoaipydirngmh.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_icIAI7n5DPxjyMvG0h6XIA_8K4GyGX9";

const supabase = createClient(supabaseUrl, supabaseKey);

class UserQuery {
  async findUnique(args: any) {
    let query = supabase.from('User').select('*');
    if (args.where?.email) {
      // Find unique email case-sensitively or case-insensitively depending on need
      query = query.eq('email', args.where.email);
    } else if (args.where?.id) {
      query = query.eq('id', args.where.id);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return null;
    
    // Apply select if specified
    if (args.select) {
      const selected: any = {};
      for (const key of Object.keys(args.select)) {
        selected[key] = data[key];
      }
      return selected;
    }
    return data;
  }

  async findMany(args?: any) {
    let query = supabase.from('User').select('*');
    if (args?.orderBy?.createdAt) {
      query = query.order('createdAt', { ascending: args.orderBy.createdAt === 'asc' });
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async count(args?: any) {
    let query = supabase.from('User').select('*', { count: 'exact', head: true });
    if (args?.where?.role?.equals) {
      query = query.eq('role', args.where.role.equals);
    } else if (args?.where?.role?.mode === 'insensitive' && args?.where?.role?.equals) {
      query = query.ilike('role', args.where.role.equals);
    }
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  async create(args: any) {
    const insertData = { ...args.data };
    if (!insertData.id) {
      insertData.id = 'c' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    const { data, error } = await supabase.from('User').insert(insertData).select().single();
    if (error) throw error;
    return data;
  }

  async update(args: any) {
    const { data, error } = await supabase.from('User').update(args.data).eq('id', args.where.id).select().single();
    if (error) throw error;
    if (args.select) {
      const selected: any = {};
      for (const key of Object.keys(args.select)) {
        selected[key] = data[key];
      }
      return selected;
    }
    return data;
  }
}

class ReviewQuery {
  async findMany(args: any) {
    let query = supabase.from('Review').select('*, user:User(firstName, lastName, email)');
    if (args.orderBy?.createdAt === 'desc') {
      query = query.order('createdAt', { ascending: false });
    }
    if (args.take) {
      query = query.limit(args.take);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async create(args: any) {
    const insertData = { ...args.data };
    if (!insertData.id) {
      insertData.id = 'c' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    const { data, error } = await supabase.from('Review').insert(insertData).select('*, user:User(firstName, lastName, email)').single();
    if (error) throw error;
    return data;
  }
}

class MockPrismaClient {
  user = new UserQuery();
  review = new ReviewQuery();
  
  $disconnect() {}
}

const globalForPrisma = global as unknown as { prisma: any };

export const prisma = new MockPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
