// pages/vault.js
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/studio/vault',
      permanent: false,
    },
  };
}

export default function VaultRedirect() {
  return null;
}
