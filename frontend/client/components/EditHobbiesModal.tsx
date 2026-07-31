import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HobbyOut {
  hobby_id: number;
  name: string;
  category: string;
}

interface EditHobbiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHobbyIds: number[];
}

export default function EditHobbiesModal({ isOpen, onClose, selectedHobbyIds }: EditHobbiesModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentSelectedIds, setCurrentSelectedIds] = useState<number[]>(selectedHobbyIds);

  const { data: allHobbies } = useQuery({
    queryKey: ["hobbies"],
    queryFn: () => apiFetch<HobbyOut[]>("/api/v1/hobbies"),
  });

  const mutation = useMutation({
    mutationFn: (hobbyIds: number[]) =>
      apiFetch("/api/v1/users/me/hobbies", {
        method: "PUT",
        body: JSON.stringify({ hobby_ids: hobbyIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast({ title: t("profile.success"), description: t("profile.hobbiesUpdated") });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: t("profile.error"), description: error.message, variant: "destructive" });
    },
  });

  const toggleHobby = (id: number) => {
    setCurrentSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    mutation.mutate(currentSelectedIds);
  };

  const groupedHobbies = allHobbies?.reduce((acc, hobby) => {
    if (!acc[hobby.category]) acc[hobby.category] = [];
    acc[hobby.category].push(hobby);
    return acc;
  }, {} as Record<string, HobbyOut[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-wc-dark font-bold text-xl">{t("profile.editHobbies")}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[50vh] pr-2 py-2">
          <div className="space-y-6">
            {groupedHobbies && Object.entries(groupedHobbies).map(([category, hobbies]) => (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-bold text-wc-gray uppercase tracking-wider">{t(`hobbiesList.${category}`, { defaultValue: category })}</h4>
                <div className="flex flex-wrap gap-2">
                  {hobbies.map((hobby) => {
                    const isSelected = currentSelectedIds.includes(hobby.hobby_id);
                    return (
                      <button
                        key={hobby.hobby_id}
                        onClick={() => toggleHobby(hobby.hobby_id)}
                        className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
                          isSelected
                            ? "bg-wc-green border-wc-green text-white shadow-sm"
                            : "bg-white border-wc-border text-wc-gray hover:border-wc-green hover:text-wc-green"
                        }`}
                      >
                        {t(`hobbiesList.${hobby.name}`, { defaultValue: hobby.name })}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-wc-border text-wc-gray"
          >
            {t("profile.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="bg-wc-green hover:bg-wc-green/90 text-white font-bold px-8"
          >
            {mutation.isPending ? t("profile.saving") : t("profile.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
