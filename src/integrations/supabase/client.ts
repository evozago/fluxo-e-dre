// Mock Supabase client - será substituído pela integração real
class MockQuery implements Promise<{ data: any[] }> {
  [Symbol.toStringTag] = 'Promise';

  then<TResult1 = { data: any[] }, TResult2 = never>(
    onfulfilled?: ((value: { data: any[] }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve({ data: [] }).then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<{ data: any[] } | TResult> {
    return Promise.resolve({ data: [] }).catch(onrejected);
  }

  finally(onfinally?: (() => void) | undefined | null): Promise<{ data: any[] }> {
    return Promise.resolve({ data: [] }).finally(onfinally);
  }

  eq(column: string, value: any) {
    return new MockQuery();
  }

  gte(column: string, value: any) {
    return new MockQuery();
  }

  lte(column: string, value: any) {
    return new MockQuery();
  }
}

export const supabase = {
  from: (table: string) => ({
    select: (columns?: string) => new MockQuery(),
    insert: (data: any) => Promise.resolve({ data: null }),
    update: (data: any) => Promise.resolve({ data: null }),
    delete: () => Promise.resolve({ data: null })
  })
};