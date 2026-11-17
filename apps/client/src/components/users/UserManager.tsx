import { useState } from "react";
import { ConfirmDialog } from "../ConfirmDialog.tsx";
import { Modal } from "../Modal.tsx";
import { StateCard } from "../StateCard.tsx";
import { CreateUserForm } from "./CreateUserForm.tsx";
import { EditUserForm } from "./EditUserForm.tsx";
import { IconEdit, IconPlus, IconRefresh, IconTrash } from "../icons.tsx";
import { useAuth } from "../../hooks/useAuth.ts";
import { useUsers } from "../../hooks/useUsers.ts";
import { getUserErrorMessage, notify } from "../../services/notifications.ts";
import {
  userService,
  type CreateUserPayload,
  type UpdateUserPayload,
} from "../../services/user.service.ts";
import type { AuthUser } from "../../types/auth.types.ts";

const CARD =
  "overflow-hidden rounded-card border border-line bg-white shadow-card";
const CARD_HEADER =
  "flex flex-wrap items-start justify-between gap-4 px-[22px] pt-5 pb-1";
const CARD_TITLE = "text-[15px] font-bold tracking-[-0.01em]";
const CARD_SUBTITLE = "mt-[3px] text-[12.5px] text-muted";

const BADGE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold";
const BADGE_SUCCESS = `${BADGE} bg-success-soft text-green-700`;
const BADGE_NEUTRAL = `${BADGE} bg-slate-100 text-slate-600`;
const BADGE_BRAND = `${BADGE} bg-brand-soft text-brand-dark`;

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-field bg-brand px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-65";

const GHOST_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-field border border-line px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-65";

const ICON_BUTTON =
  "inline-flex size-[38px] items-center justify-center rounded-field border border-line bg-white text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-ink";

const ICON_BUTTON_SM =
  "inline-flex size-8 items-center justify-center rounded-lg border border-line bg-white text-ink-soft transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-ink";

const ICON_BUTTON_DANGER =
  "hover:border-red-200 hover:bg-danger-soft hover:text-red-700";

const TH =
  "whitespace-nowrap border-b border-line px-[22px] py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.07em] text-muted max-md:px-4";
const TD =
  "whitespace-nowrap border-b border-slate-100 px-[22px] py-[13px] align-middle max-md:px-4";

const SPINNER =
  "size-4 animate-spin rounded-full border-2 border-white/35 border-t-white";

const SELF_BADGE =
  "ml-2 rounded-full bg-brand-soft px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-brand-dark";

const roleLabel = (user: AuthUser): string =>
  user.role === "admin" ? "Administrador" : "Empleado";

const displayName = (user: AuthUser): string => user.fullname;

export function UserManager() {
  const { user: currentUser } = useAuth();
  const [includeInactive, setIncludeInactive] = useState(false);
  const { users, isLoading, error, reload } = useUsers(includeInactive);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<AuthUser | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<number | null>(null);

  const openCreate = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const openEdit = (user: AuthUser) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (isSubmitting) {
      return;
    }

    setIsFormOpen(false);
    setEditingUser(null);
  };

  const handleCreate = async (payload: CreateUserPayload): Promise<boolean> => {
    setIsSubmitting(true);

    try {
      await userService.create(payload);
      notify.success("Usuario creado correctamente.");
      setIsFormOpen(false);
      reload();
      return true;
    } catch (submitError) {
      notify.error(getUserErrorMessage(submitError));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (payload: UpdateUserPayload): Promise<boolean> => {
    if (!editingUser) {
      return false;
    }

    setIsSubmitting(true);

    try {
      await userService.update(editingUser.id, payload);
      notify.success(`Usuario "${payload.fullname ?? editingUser.fullname}" actualizado.`);
      setIsFormOpen(false);
      setEditingUser(null);
      reload();
      return true;
    } catch (submitError) {
      notify.error(getUserErrorMessage(submitError));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!userToDeactivate) {
      return;
    }

    setIsDeleting(true);

    try {
      await userService.remove(userToDeactivate.id);
      notify.success(`Se desactivó a "${displayName(userToDeactivate)}".`);
      setUserToDeactivate(null);
      reload();
    } catch (deleteError) {
      notify.error(getUserErrorMessage(deleteError));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReactivate = async (user: AuthUser) => {
    setReactivatingId(user.id);

    try {
      await userService.update(user.id, { isActive: true });
      notify.success(`Se reactivó a "${displayName(user)}".`);
      reload();
    } catch (reactivateError) {
      notify.error(getUserErrorMessage(reactivateError));
    } finally {
      setReactivatingId(null);
    }
  };

  return (
    <section className={CARD}>
      <div className={CARD_HEADER}>
        <div>
          <h2 className={CARD_TITLE}>Gestión de usuarios</h2>
          <p className={CARD_SUBTITLE}>
            Administrá las cuentas y accesos del comercio. Solo los
            administradores pueden crear, editar o desactivar usuarios.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[13px] font-medium text-ink-soft">
            <input
              className="size-4 cursor-pointer accent-brand"
              type="checkbox"
              checked={includeInactive}
              onChange={(event) => setIncludeInactive(event.target.checked)}
            />
            Mostrar inactivos
          </label>

          <button type="button" className={PRIMARY_BUTTON} onClick={openCreate}>
            <IconPlus width={16} height={16} />
            Crear usuario
          </button>

          <button
            type="button"
            className={ICON_BUTTON}
            onClick={reload}
            aria-label="Actualizar listado"
            title="Actualizar listado"
          >
            <IconRefresh width={18} height={18} />
          </button>
        </div>
      </div>

      {error ? (
        <StateCard
          title="No pudimos cargar los usuarios"
          message={error}
          tone="error"
          action={
            <button type="button" className={GHOST_BUTTON} onClick={reload}>
              Reintentar
            </button>
          }
        />
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                <th className={TH}>Usuario</th>
                <th className={TH}>Email</th>
                <th className={TH}>Rol</th>
                <th className={TH}>Estado</th>
                <th className={TH}>Acciones</th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0 [&>tr:hover]:bg-slate-50">
              {isLoading ? (
                <tr>
                  <td className={TD} colSpan={5}>
                    <div className="flex items-center justify-center gap-3 py-[26px] text-[13.5px] text-muted">
                      <span
                        className="size-8 animate-spin rounded-full border-[3px] border-line border-t-brand"
                        aria-hidden="true"
                      />
                      <span>Cargando usuarios...</span>
                    </div>
                  </td>
                </tr>
              ) : null}

              {!isLoading && users.length === 0 ? (
                <tr>
                  <td className={TD} colSpan={5}>
                    <div className="flex items-center justify-center gap-3 py-[26px] text-[13.5px] text-muted">
                      {includeInactive
                        ? "Todavía no hay usuarios cargados."
                        : "No hay usuarios activos. Creá uno nuevo o activá la opción de mostrar inactivos."}
                    </div>
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? users.map((user) => {
                    const isSelf = currentUser?.id === user.id;

                    return (
                      <tr key={user.id}>
                        <td className={TD}>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-ink">
                              {displayName(user)}
                              {isSelf ? (
                                <span className={SELF_BADGE}>Vos</span>
                              ) : null}
                            </span>
                            <span className="text-[12px] text-muted">
                              @{user.username}
                            </span>
                          </div>
                        </td>
                        <td className={`${TD} text-ink-soft`}>{user.email}</td>
                        <td className={TD}>
                          <span
                            className={
                              user.role === "admin"
                                ? BADGE_BRAND
                                : BADGE_NEUTRAL
                            }
                          >
                            {roleLabel(user)}
                          </span>
                        </td>
                        <td className={TD}>
                          <span
                            className={
                              user.isActive ? BADGE_SUCCESS : BADGE_NEUTRAL
                            }
                          >
                            {user.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className={TD}>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className={ICON_BUTTON_SM}
                              title="Editar usuario"
                              aria-label={`Editar a ${displayName(user)}`}
                              onClick={() => openEdit(user)}
                            >
                              <IconEdit width={16} height={16} />
                            </button>

                            {!user.isActive ? (
                              <button
                                type="button"
                                className={GHOST_BUTTON}
                                onClick={() => handleReactivate(user)}
                                disabled={reactivatingId === user.id}
                              >
                                {reactivatingId === user.id ? (
                                  <span className={SPINNER} />
                                ) : null}
                                Reactivar
                              </button>
                            ) : isSelf ? (
                              <button
                                type="button"
                                className={`${ICON_BUTTON_SM} cursor-not-allowed opacity-50`}
                                title="No podés desactivar tu propia cuenta"
                                aria-label="No podés desactivar tu propia cuenta"
                                disabled
                              >
                                <IconTrash width={16} height={16} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={`${ICON_BUTTON_SM} ${ICON_BUTTON_DANGER}`}
                                title="Desactivar usuario"
                                aria-label={`Desactivar a ${displayName(user)}`}
                                onClick={() => setUserToDeactivate(user)}
                              >
                                <IconTrash width={16} height={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                : null}
            </tbody>
          </table>
        </div>
      )}

      {isFormOpen ? (
        <Modal
          title={editingUser ? "Editar usuario" : "Nuevo usuario"}
          description={
            editingUser
              ? "Modificá los datos de la cuenta y guardá los cambios."
              : "Completá los datos para registrar una nueva cuenta."
          }
          isBusy={isSubmitting}
          onClose={closeForm}
        >
          {editingUser ? (
            <EditUserForm
              key={editingUser.id}
              user={editingUser}
              lockRole={currentUser?.id === editingUser.id}
              isSubmitting={isSubmitting}
              onSubmit={handleUpdate}
            />
          ) : (
            <CreateUserForm
              isSubmitting={isSubmitting}
              onSubmit={handleCreate}
            />
          )}
        </Modal>
      ) : null}

      {userToDeactivate ? (
        <ConfirmDialog
          title="Desactivar usuario"
          message={`¿Confirmás que querés desactivar a "${displayName(userToDeactivate)}"? No podrá iniciar sesión, pero podrás reactivarlo desde el listado de inactivos.`}
          confirmLabel="Desactivar"
          tone="danger"
          isBusy={isDeleting}
          onConfirm={handleConfirmDeactivate}
          onCancel={() => {
            if (!isDeleting) {
              setUserToDeactivate(null);
            }
          }}
        />
      ) : null}
    </section>
  );
}
