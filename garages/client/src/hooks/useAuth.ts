// client/src/hooks/useAuth.ts
export function useAuth() {
  // 最小ダミー（ログイン判定は常にfalse）
  return {
    user: null as null | { id: string; name: string },
    login: async () => {},
    logout: async () => {},
  };
}
