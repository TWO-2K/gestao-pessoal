import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lerTokenBrapi, salvarTokenBrapi } from "@/lib/cotacoes";

export default function TokenBrapiDialog({ open, onOpenChange, onSaved }) {
  const [token, setToken] = useState(lerTokenBrapi);

  const salvar = (e) => {
    e.preventDefault();
    salvarTokenBrapi(token.trim());
    onOpenChange(false);
    if (token.trim()) onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Token das cotações</DialogTitle></DialogHeader>
        <form onSubmit={salvar} className="space-y-4 text-sm">
          <p className="text-ink-500">
            As cotações vêm da brapi.dev. Crie uma conta gratuita em brapi.dev, copie seu token do painel e cole aqui.
            Ele fica salvo só neste navegador.
          </p>
          <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token da brapi" autoFocus />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar e atualizar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
