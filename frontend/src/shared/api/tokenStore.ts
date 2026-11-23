// Access token vive só na memória do processo do browser (nunca localStorage
// — XSS lê localStorage). Refresh token vive em cookie httpOnly setado pelo
// backend; o JS aqui nunca o vê nem precisa manuseá-lo.
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token;
  },
};
