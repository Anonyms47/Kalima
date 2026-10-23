import type { Metadata } from "next";
import { AuthForm } from "./auth-form";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8 px-4 py-20">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Accédez à votre espace
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Connectez-vous ou créez un compte avec votre adresse e-mail.
        </p>
      </div>
      <AuthForm />
    </div>
  );
}
