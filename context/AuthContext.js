// context/AuthContext.js
import { createContext, useContext } from "react";

const AuthContext = createContext({
  supabase: null,
  session: null,
  user: null,
  ready: false,
});

export default AuthContext;

export function useAuth() {
  return useContext(AuthContext);
}
