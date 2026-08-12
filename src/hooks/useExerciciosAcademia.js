import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const BUCKET_FOTOS = "academia-exercicios-fotos";

export function useExerciciosAcademia() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data: exerciciosBrutos = [], isLoading } = useQuery({
    queryKey: ["academia-exercicios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academia_exercicios")
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const exercicios = exerciciosBrutos.map((ex) => ({
    ...ex,
    foto_url: ex.foto_path
      ? supabase.storage.from(BUCKET_FOTOS).getPublicUrl(ex.foto_path).data.publicUrl
      : null,
  }));

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["academia-exercicios"] });

  const createMutation = useMutation({
    mutationFn: async ({ nome, grupo_muscular }) => {
      const payload = {
        nome: nome.trim(),
        grupo_muscular: grupo_muscular || null,
        created_by: session?.user?.id || null,
      };
      const { data, error } = await supabase.from("academia_exercicios").insert(payload).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: invalidar,
  });

  const uploadFotoMutation = useMutation({
    mutationFn: async ({ exercicioId, file, fotoPathAnterior }) => {
      const extensao = file.name.split(".").pop();
      const storagePath = `${exercicioId}/${crypto.randomUUID()}.${extensao}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET_FOTOS).upload(storagePath, file);
      if (uploadError) throw new Error(uploadError.message);

      const { error: updateError } = await supabase
        .from("academia_exercicios")
        .update({ foto_path: storagePath })
        .match({ id: exercicioId });
      if (updateError) throw new Error(updateError.message);

      if (fotoPathAnterior) {
        await supabase.storage.from(BUCKET_FOTOS).remove([fotoPathAnterior]);
      }
    },
    onSuccess: invalidar,
  });

  return {
    exercicios,
    isLoading,
    createExercicio: createMutation.mutateAsync,
    uploadFotoExercicio: uploadFotoMutation.mutateAsync,
  };
}
