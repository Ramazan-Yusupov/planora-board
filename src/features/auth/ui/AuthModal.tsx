"use client";

import { AlertTriangle, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { isValidAuthHandle, normalizeAuthHandle } from "@/shared/api/supabase";
import { Button, Modal, TextField } from "@/shared/ui";

import { useAuth } from "../model/AuthProvider";

type AuthMode = "login" | "register";

type AuthFormValues = {
  handle: string;
  password: string;
  confirmPassword: string;
};

type AuthModalProps = Readonly<{
  initialMode?: AuthMode;
  onClose: () => void;
}>;

export function AuthModal({ initialMode = "login", onClose }: AuthModalProps) {
  const auth = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<AuthFormValues>({
    defaultValues: {
      confirmPassword: "",
      handle: "@",
      password: "",
    },
  });
  const password = watch("password");
  const watchedHandle = watch("handle");
  const handleField = register("handle", {
    validate: (value) =>
      isValidAuthHandle(normalizeAuthHandle(value)) ||
      "Используйте формат @name747: lowercase, цифры и _.",
  });
  const passwordField = register("password", {
    minLength: {
      message: "Минимум 8 символов.",
      value: 8,
    },
    required: "Введите пароль.",
  });
  const confirmPasswordField = register("confirmPassword", {
    validate: (value) =>
      mode === "login" || value === password || "Пароли должны совпадать.",
  });
  const title = mode === "login" ? "Вход в Planora" : "Регистрация";
  const isRegister = mode === "register";
  const submitLabel = isRegister ? "Создать аккаунт" : "Войти";
  const normalizedHandlePreview = normalizeAuthHandle(watchedHandle);

  const submit = handleSubmit(async (values) => {
    const normalizedHandle = normalizeAuthHandle(values.handle);
    const error =
      mode === "register"
        ? await auth.signUp(normalizedHandle, values.password)
        : await auth.signIn(normalizedHandle, values.password);

    if (error) {
      setFormError(error);
      return;
    }

    reset();
    onClose();
  });

  return (
    <Modal title={title} zIndexClassName="z-[90] " onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        {!auth.isConfigured ? (
          <div className="rounded-xl border border-amber-300/30 bg-amber-950/35 px-3 py-3 text-sm leading-6 text-amber-100">
            Supabase не настроен. Нужны `NEXT_PUBLIC_SUPABASE_URL` и
            `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
          </div>
        ) : null}

        {isRegister ? (
          <div className="rounded-xl border border-amber-300/30 bg-amber-950/35 px-3 py-3 text-sm leading-6 text-amber-100">
            <div className="flex gap-2">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                size={17}
              />
              <p>
                Не используйте часто используемый пароль, пароль от почты,
                банков, соцсетей или других важных аккаунтов.
              </p>
            </div>
          </div>
        ) : null}

        <div>
          <label
            className="text-sm font-medium text-text"
            htmlFor="auth-handle"
          >
            Логин
          </label>
          <TextField
            id="auth-handle"
            className="mt-2"
            placeholder="@name747"
            autoComplete="username"
            {...handleField}
            onChange={(event) => {
              const normalizedValue = normalizeAuthHandle(event.target.value);
              setValue("handle", normalizedValue, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          />
          <p className="mt-1 text-xs leading-5 text-text-muted">
            Логин должен начинаться с `@`. Пример:{" "}
            <span className="font-medium text-text">
              {normalizedHandlePreview || "@name747"}
            </span>
          </p>
          {errors.handle ? (
            <p className="mt-1 text-sm text-red-300">{errors.handle.message}</p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-text"
            htmlFor="auth-password"
          >
            Пароль
          </label>
          <TextField
            id="auth-password"
            className="mt-2"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            {...passwordField}
          />
          {errors.password ? (
            <p className="mt-1 text-sm text-red-300">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {isRegister ? (
          <div>
            <label
              className="text-sm font-medium text-text"
              htmlFor="auth-confirm-password"
            >
              Подтверждение пароля
            </label>
            <TextField
              id="auth-confirm-password"
              className="mt-2"
              type="password"
              autoComplete="new-password"
              {...confirmPasswordField}
            />
            {errors.confirmPassword ? (
              <p className="mt-1 text-sm text-red-300">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
        ) : null}

        {formError || auth.error ? (
          <p className="rounded-xl border border-red-400/25 bg-red-950/35 px-3 py-2 text-sm text-red-100">
            {formError ?? auth.error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              setFormError(null);
              setMode(isRegister ? "login" : "register");
            }}
          >
            {isRegister ? "Уже есть аккаунт" : "Создать аккаунт"}
          </Button>
          <Button
            disabled={!auth.isConfigured || isSubmitting || auth.isLoading}
            type="submit"
          >
            {isRegister ? (
              <UserPlus aria-hidden="true" size={17} />
            ) : (
              <LogIn aria-hidden="true" size={17} />
            )}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
