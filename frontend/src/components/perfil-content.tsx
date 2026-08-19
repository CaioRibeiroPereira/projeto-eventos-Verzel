"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  addCard,
  changePassword,
  deleteAccount,
  listCards,
  removeCard,
  updateProfile,
  type Card,
} from "@/lib/api";
import { formatCardNumber, formatExpiry } from "@/lib/format";
import { CreditCardIcon, LogoutIcon, TrashIcon, UserIcon } from "@/components/icons";

const LOGIN_HREF: Record<string, string> = {
  organizer: "/organizador/login",
  gate: "/portaria/login",
  customer: "/login?next=/perfil",
};

// Fora do componente de propósito: quando o logout zera `user`, o AppShell
// troca de shell (admin -> cliente) e isso remonta a página, perdendo
// qualquer state local. Um módulo-level sobrevive ao remount.
let pendingLogoutRedirect: string | null = null;

export function PerfilContent({ fallbackLoginHref }: { fallbackLoginHref: string }) {
  const { user, token, loading, logout, setUser } = useAuth();
  const router = useRouter();
  const [accountDeleted, setAccountDeleted] = useState(false);

  useEffect(() => {
    if (loading || accountDeleted) return;
    if (!user) {
      const destination = pendingLogoutRedirect ?? fallbackLoginHref;
      router.replace(destination);
      // limpa depois do tick atual — em dev o StrictMode roda esse efeito
      // duas vezes seguidas, e limpar na hora derrubaria a segunda leitura.
      setTimeout(() => {
        pendingLogoutRedirect = null;
      }, 0);
    }
  }, [loading, user, accountDeleted, router, fallbackLoginHref]);

  function handleLogout() {
    if (user) pendingLogoutRedirect = LOGIN_HREF[user.role];
    logout();
  }

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const [cards, setCards] = useState<Card[] | null>(null);
  const [cardForm, setCardForm] = useState({ number: "", holder_name: "", expiry: "" });
  const [cardErr, setCardErr] = useState<string | null>(null);
  const [savingCard, setSavingCard] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;
    listCards(token).then(setCards);
  }, [token]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSavingProfile(true);
    setProfileMsg(null);
    setProfileErr(null);
    try {
      const updated = await updateProfile(token, { name, email });
      setUser(updated);
      setProfileMsg("Dados atualizados.");
    } catch (err) {
      setProfileErr(err instanceof ApiError ? err.message : "Não foi possível salvar.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSavingPassword(true);
    setPasswordMsg(null);
    setPasswordErr(null);
    try {
      await changePassword(token, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordMsg("Senha alterada.");
    } catch (err) {
      setPasswordErr(err instanceof ApiError ? err.message : "Não foi possível trocar a senha.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSavingCard(true);
    setCardErr(null);
    try {
      const card = await addCard(token, cardForm);
      setCards((prev) => [...(prev ?? []), card]);
      setCardForm({ number: "", holder_name: "", expiry: "" });
    } catch (err) {
      setCardErr(err instanceof ApiError ? err.message : "Não foi possível salvar o cartão.");
    } finally {
      setSavingCard(false);
    }
  }

  async function handleRemoveCard(cardId: number) {
    if (!token) return;
    await removeCard(token, cardId);
    setCards((prev) => prev?.filter((c) => c.id !== cardId) ?? null);
  }

  async function handleDeleteAccount() {
    if (!token) return;
    setDeleting(true);
    try {
      await deleteAccount(token);
      setAccountDeleted(true);
      logout();
      router.push("/");
    } finally {
      setDeleting(false);
    }
  }

  if (loading || !user) {
    return (
      <main className="flex flex-1 items-center justify-center py-24">
        <p className="label">Carregando...</p>
      </main>
    );
  }

  const cardValid =
    cardForm.number.replace(/\s/g, "").length >= 12 &&
    cardForm.holder_name.trim().length > 2 &&
    cardForm.expiry.length === 5;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-14">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserIcon className="h-8 w-8 text-accent" />
          <div>
            <h1 className="movie-title !text-2xl">Meu perfil</h1>
            <p className="label">{user.name}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent"
        >
          <LogoutIcon className="h-4 w-4" />
          Sair
        </button>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface-1 p-6">
        <h2>Dados da conta</h2>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
          <div>
            <label className="label mb-1 block" htmlFor="name">
              Nome
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="label mb-1 block" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
            />
          </div>
          {profileErr && <p className="text-sm text-red">{profileErr}</p>}
          {profileMsg && <p className="text-sm text-text-success">{profileMsg}</p>}
          <button
            type="submit"
            disabled={savingProfile}
            className="w-fit rounded bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
          >
            {savingProfile ? "Salvando..." : "Salvar dados"}
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface-1 p-6">
        <h2>Trocar senha</h2>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          <div>
            <label className="label mb-1 block" htmlFor="current_password">
              Senha atual
            </label>
            <input
              id="current_password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="label mb-1 block" htmlFor="new_password">
              Nova senha
            </label>
            <input
              id="new_password"
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
            />
          </div>
          {passwordErr && <p className="text-sm text-red">{passwordErr}</p>}
          {passwordMsg && <p className="text-sm text-text-success">{passwordMsg}</p>}
          <button
            type="submit"
            disabled={savingPassword}
            className="w-fit rounded bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
          >
            {savingPassword ? "Salvando..." : "Trocar senha"}
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface-1 p-6">
        <div>
          <h2>Cartões salvos</h2>
          <p className="caption">
            Guardamos só os últimos 4 dígitos e a bandeira — nunca o número completo ou o CVV.
          </p>
        </div>

        {cards === null && <p className="label">Carregando...</p>}
        {cards?.length === 0 && <p className="label">Nenhum cartão salvo.</p>}

        <div className="flex flex-col gap-2">
          {cards?.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between rounded border border-border bg-surface-2 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <CreditCardIcon className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-text">
                    {card.brand} •••• {card.last4}
                  </p>
                  <p className="caption">
                    {card.holder_name} — vence {card.expiry}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveCard(card.id)}
                className="text-text-muted hover:text-red"
                aria-label="Remover cartão"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddCard} className="flex flex-col gap-3 border-t border-border pt-4">
          <input
            placeholder="Número do cartão"
            value={cardForm.number}
            onChange={(e) => setCardForm({ ...cardForm, number: formatCardNumber(e.target.value) })}
            className="ticket-code rounded border border-border bg-surface-2 px-3 py-2 outline-none focus:border-accent"
          />
          <input
            placeholder="Nome impresso no cartão"
            value={cardForm.holder_name}
            onChange={(e) => setCardForm({ ...cardForm, holder_name: e.target.value })}
            className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
          <input
            placeholder="MM/AA"
            value={cardForm.expiry}
            onChange={(e) => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
            className="ticket-code w-24 rounded border border-border bg-surface-2 px-3 py-2 outline-none focus:border-accent"
          />
          {cardErr && <p className="text-sm text-red">{cardErr}</p>}
          <button
            type="submit"
            disabled={savingCard || !cardValid}
            className="w-fit rounded border border-accent px-4 py-2 text-sm text-accent hover:bg-accent hover:text-on-accent disabled:opacity-60"
          >
            {savingCard ? "Salvando..." : "Adicionar cartão"}
          </button>
        </form>
      </section>

      {user.role === "organizer" || user.role === "gate" ? (
        <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface-1 p-6">
          <h2>Apagar conta</h2>
          <p className="caption">
            {user.role === "organizer"
              ? "Conta de organizador é provisionada pela equipe do Cine Verzel e não pode ser apagada por aqui. Fale com a equipe se precisar encerrar o acesso."
              : "Conta de portaria não pode ser apagada por aqui — peça pro organizador remover na Equipe da portaria, no painel dele."}
          </p>
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-lg border border-border-danger bg-bg-danger p-6">
          <h2 className="text-text-danger">Apagar conta</h2>
          <p className="caption">
            Sua conta é desativada e seus dados pessoais são removidos. Ingressos e eventos já
            emitidos continuam valendo normalmente. Essa ação não pode ser desfeita.
          </p>
          {!confirmingDelete ? (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="w-fit rounded border border-red px-4 py-2 text-sm text-red hover:bg-red hover:text-on-red"
            >
              Apagar minha conta
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded bg-red px-4 py-2 text-sm font-medium text-on-red hover:bg-red-hover disabled:opacity-60"
              >
                {deleting ? "Apagando..." : "Sim, apagar definitivamente"}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-sm text-text-secondary hover:text-text"
              >
                Cancelar
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
