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

  const { data: fotosBrutas = [] } = useQuery({
    queryKey: ["academia-exercicio-fotos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academia_exercicio_fotos")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const exercicios = exerciciosBrutos.map((ex) => {
    const fotos = fotosBrutas
      .filter((f) => f.exercicio_id === ex.id)
      .map((f) => ({
        id: f.id,
        foto_path: f.foto_path,
        url: supabase.storage.from(BUCKET_FOTOS).getPublicUrl(f.foto_path).data.publicUrl,
      }));
    return {
      ...ex,
      fotos,
      foto_url: fotos[0]?.url || null,
    };
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["academia-exercicios"] });
  const invalidarFotos = () => queryClient.invalidateQueries({ queryKey: ["academia-exercicio-fotos"] });

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
    mutationFn: async ({ exercicioId, file }) => {
      const extensao = file.name.split(".").pop();
      const storagePath = `${exercicioId}/${crypto.randomUUID()}.${extensao}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET_FOTOS).upload(storagePath, file);
      if (uploadError) throw new Error(uploadError.message);

      const { error: insertError } = await supabase
        .from("academia_exercicio_fotos")
        .insert({ exercicio_id: exercicioId, foto_path: storagePath });
      if (insertError) throw new Error(insertError.message);
    },
    onSuccess: invalidarFotos,
  });

  const removeFotoMutation = useMutation({
    mutationFn: async ({ fotoId, fotoPath }) => {
      const { error: deleteError } = await supabase.from("academia_exercicio_fotos").delete().match({ id: fotoId });
      if (deleteError) throw new Error(deleteError.message);
      await supabase.storage.from(BUCKET_FOTOS).remove([fotoPath]);
    },
    onSuccess: invalidarFotos,
  });

  return {
    exercicios,
    isLoading,
    createExercicio: createMutation.mutateAsync,
    uploadFotoExercicio: uploadFotoMutation.mutateAsync,
    removeFotoExercicio: removeFotoMutation.mutateAsync,
  };
}
