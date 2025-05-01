import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import PlanList from "./plan-list";

const PlanModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose} aria-label="Modal de Planos">
      <DialogOverlay className="fixed inset-0 bg-black bg-opacity-30 z-50" />
      <DialogContent
        className="flex flex-col items-center bg-white p-6 md:p-8 lg:p-10 rounded-lg shadow-lg w-full max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] mx-auto overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl font-bold mb-4 text-center">
            Entenda os Planos
          </DialogTitle>
        </DialogHeader>
        {/* Conteúdo do modal: exibe os planos de assinatura */}
        <div className="max-h-[80vh] overflow-y-auto">
          <PlanList />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanModal;
