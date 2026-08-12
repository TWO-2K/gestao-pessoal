import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useViewAs } from "@/lib/ViewAsContext";
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "academia-fotos";

export function useFotosProgresso() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { viewedUserId } = useViewAs();

  const { data: fotos = [], isLoading } = useQuery({
    queryKey: ["academia-fotos-progresso", viewedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academia_fotos_progresso")
        .select("*")
        .eq("user_id", viewedUserId)
        .order("data", { ascending: false });
      if (error) throw new Error(error.message);

      const comUrl = await Promise.all(
        data.map(async (foto) => {
          const { data: signed } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(foto.storage_path, 60 * 60);
          return { ...foto, url: signed?.signedUrl || null };
        })
      );
      return comUrl;
    },
    enabled: !!viewedUserId,
  });

  const mutationOptions = {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academia-fotos-progresso"] }),
  };

  const uploadMutation = useMutation({
    mutationFn: async ({ file, data }) => {
      const targetUserId = viewedUserId || session?.user?.id;
      const extensao = file.name.split(".").pop();
      const storagePath = `${targetUserId}/${crypto.randomUUID()}.${extensao}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file);
      if (uploadError) throw new Error(uploadError.message);

      const { error: insertError } = await supabase
        .from("academia_fotos_progresso")
        .insert({ data, storage_path: storagePath, user_id: targetUserId });
      if (insertError) throw new Error(insertError.message);
    },
    ...mutationOptions,
  });

  const deleteMutation = useMutation({
    mutationFn: async (foto) => {
      await supabase.storage.from(BUCKET).remove([foto.storage_path]);
      const { error } = await supabase.from("academia_fotos_progresso").delete().match({ id: foto.id });
      if (error) throw new Error(error.message);
    },
    ...mutationOptions,
  });

  return {
    fotos,
    isLoading,
    uploadFoto: uploadMutation.mutateAsync,
    deleteFoto: deleteMutation.mutateAsync,
  };
}
