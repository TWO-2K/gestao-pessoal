import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Upload, CheckCircle2 } from "lucide-react";
import { lerPlanilhaInvestimentos } from "@/lib/investimentos";

export default function InvestimentosImportDialog({ open, onOpenChange, importar }) {
  const [dados, setDados] = useState(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const { toast } = useToast();

  const reset = () => { setDados(null); setNomeArquivo(""); setResultado(null); };

  const handleClose = (v) => {
    if (importando) return;
    if (!v) reset();
    onOpenChange(v);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNomeArquivo(file.name);
    try {
      setDados(await lerPlanilhaInvestimentos(file));
    } catch (err) {
      toast({ variant: "destructive", title: "Não consegui ler a planilha", description: err.message });
    }
  };

  const confirmar = async (apenasAtivos = false) => {
    setImportando(true);
    try {
      setResultado(await importar(apenasAtivos ? { ...dados, aportes: [], proventos: [] } : dados));
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao importar", description: err.message });
    } finally {
      setImportando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Importar planilha de investimentos</DialogTitle></DialogHeader>
        {resultado ? (
          <div className="space-y-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-ink-900"><CheckCircle2 className="h-4 w-4" /> Importação concluída</p>
            <p className="text-ink-500">
              {resultado.ativos} ativos novos, {resultado.aportes} aportes e {resultado.proventos} proventos.
            </p>
            <div className="flex justify-end"><Button onClick={() => handleClose(false)}>Fechar</Button></div>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <p className="text-ink-500">
              Envie a "Planilha de Investimentos Automatizada" (.xlsx) com as abas Aportes, Carteira e Dividendos.
              Importe uma vez só: rodar de novo duplica aportes e proventos.
            </p>
            <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 px-4 py-6 cursor-pointer text-ink-500 hover:text-ink-900">
              <Upload className="h-4 w-4" />
              {nomeArquivo || "Escolher arquivo"}
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
            </label>
            {dados && (
              <>
                <p className="text-ink-900">
                  Encontrei {dados.ativos.length} ativos, {dados.aportes.length} aportes e {dados.proventos.length} proventos.
                </p>
                {dados.avisos.length > 0 && (
                  <ul className="list-disc pl-5 text-xs text-ink-500 max-h-24 overflow-y-auto">
                    {dados.avisos.map((a) => <li key={a}>{a}</li>)}
                  </ul>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => handleClose(false)}>Cancelar</Button>
                  <Button variant="outline" onClick={() => confirmar(true)} disabled={importando}>Só atualizar valor teto</Button>
                  <Button onClick={() => confirmar(false)} disabled={importando}>{importando ? "Importando..." : "Importar tudo"}</Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
