import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";
import { semAcento } from "@/lib/text";

const normalizarTitulo = (titulo) => semAcento(String(titulo || "").trim().toLowerCase());

export function useMidias() {
  const queryClient = useQueryClient();
  const { viewedUserId } = useViewAs();
  const userId = viewedUserId;

  const { data: midias = [], isLoading } = useQuery({
    queryKey: ["midias-catalogo", userId],
    queryFn: async () => {
      const [{ data: catalogo, error: catalogoError }, { data: statusRows, error: statusError }] = await Promise.all([
        supabase.from("lista_midias_catalogo").select("*").order("created_at", { ascending: false }),
        supabase.from("lista_midia_status").select("*"),
      ]);
      if (catalogoError) throw new Error(catalogoError.message);
      if (statusError) throw new Error(statusError.message);

      const statusPorMidia = {};
      for (const s of statusRows) {
        if (!statusPorMidia[s.midia_id]) statusPorMidia[s.midia_id] = {};
        statusPorMidia[s.midia_id][s.user_id] = s;
      }

      return catalogo.map((m) => {
        const statusPorUsuario = statusPorMidia[m.id] || {};
        const meuStatus = statusPorUsuario[userId];
        return {
          ...m,
          status: meuStatus?.status || "pendente",
          episodio_atual: meuStatus?.episodio_atual ?? null,
          observacoes: meuStatus?.observacoes ?? null,
          statusPorUsuario,
        };
      });
    },
    enabled: !!userId,
  });

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["midias-catalogo"] }),
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("lista_midias_catalogo").delete().match({ id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (form) => {
      const tituloNormalizado = normalizarTitulo(form.titulo);
      const duplicata = midias.find(
        (m) => m.id !== form.id && m.tipo === form.tipo && normalizarTitulo(m.titulo) === tituloNormalizado
      );
      if (duplicata) {
        throw new Error(`Já existe um(a) "${form.tipo}" com o título "${form.titulo}".`);
      }

      const catalogoPayload = {
        titulo: form.titulo,
        tipo: form.tipo,
        ano: form.ano === "" || form.ano === null || form.ano === undefined ? null : Number(form.ano),
        genero: form.genero || null,
        franquia_id: form.franquia_id || null,
        midia_pai_id: form.midia_pai_id || null,
      };

      let catalogoId = form.id;
      if (catalogoId) {
        const { error } = await supabase.from("lista_midias_catalogo").update(catalogoPayload).match({ id: catalogoId });
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await supabase.from("lista_midias_catalogo").insert(catalogoPayload).select().single();
        if (error) throw new Error(error.message);
        catalogoId = data.id;
      }

      const statusPayload = {
        midia_id: catalogoId,
        user_id: userId,
        status: form.status,
        episodio_atual: form.episodio_atual === "" || form.episodio_atual === null || form.episodio_atual === undefined ? null : Number(form.episodio_atual),
        observacoes: form.observacoes || null,
        updated_at: new Date().toISOString(),
      };
      const { error: statusError } = await supabase
        .from("lista_midia_status")
        .upsert(statusPayload, { onConflict: "midia_id,user_id" });
      if (statusError) throw new Error(statusError.message);

      return { id: catalogoId, ...catalogoPayload, status: form.status };
    },
    ...mutationOptions,
  });

  return {
    midias,
    isLoading,
    deleteMidia: deleteMutation.mutate,
    createOrUpdateMidia: createOrUpdateMutation.mutateAsync,
  };
}
