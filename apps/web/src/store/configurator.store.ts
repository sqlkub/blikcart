import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConfiguratorSchemaDto, ConfiguratorStep, PriceEstimate } from '@blikcart/types';

interface ConfiguratorState {
  // Schema
  category: string | null;
  productId: string | null;
  schemaVersionId: string | null;
  basePrice: number;
  moq: number;
  leadTimeStandardDays: number;
  steps: ConfiguratorStep[];
  // Selections
  currentStep: number;
  selections: Record<string, string>;
  quantity: number;
  deliveryType: 'standard' | 'express';
  notes: string;
  referenceFiles: string[];
  // Draft
  draftId: string | null;
  estimatedPrice: PriceEstimate | null;
  completionPercent: number;
  isSaving: boolean;
  lastSaved: string | null;
  // Actions
  initSchema: (schema: ConfiguratorSchemaDto, productId: string) => void;
  setDraftId: (id: string) => void;
  selectOption: (stepId: string, optionId: string) => void;
  setQuantity: (qty: number) => void;
  setDeliveryType: (type: 'standard' | 'express') => void;
  setNotes: (notes: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  setEstimate: (estimate: PriceEstimate, completionPercent: number) => void;
  setSaving: (saving: boolean) => void;
  markSaved: () => void;
  reset: () => void;
  // Computed
  visibleSteps: () => ConfiguratorStep[];
  isStepComplete: (stepId: string) => boolean;
  canProceed: () => boolean;
}

export const useConfiguratorStore = create<ConfiguratorState>()(
  persist(
    (set, get) => ({
      category: null,
      productId: null,
      schemaVersionId: null,
      basePrice: 0,
      moq: 1,
      leadTimeStandardDays: 21,
      steps: [],
      currentStep: 0,
      selections: {},
      quantity: 1,
      deliveryType: 'standard',
      notes: '',
      referenceFiles: [],
      draftId: null,
      estimatedPrice: null,
      completionPercent: 0,
      isSaving: false,
      lastSaved: null,

      initSchema: (schema, productId) => set({
        category: schema.categorySlug,
        productId,
        schemaVersionId: schema.schemaVersionId,
        basePrice: schema.basePrice,
        moq: schema.moq,
        leadTimeStandardDays: schema.leadTimeStandardDays,
        steps: schema.steps as ConfiguratorStep[],
        quantity: schema.moq,
        currentStep: 0,
        selections: {},
        estimatedPrice: null,
        completionPercent: 0,
        draftId: null,
      }),

      setDraftId: (id) => set({ draftId: id }),
      selectOption: (stepId, optionId) => set(s => ({ selections: { ...s.selections, [stepId]: optionId } })),
      setQuantity: (qty) => set(s => ({ quantity: Math.max(s.moq, qty) })),
      setDeliveryType: (type) => set({ deliveryType: type }),
      setNotes: (notes) => set({ notes }),
      setEstimate: (estimatedPrice, completionPercent) => set({ estimatedPrice, completionPercent }),
      setSaving: (isSaving) => set({ isSaving }),
      markSaved: () => set({ isSaving: false, lastSaved: new Date().toISOString() }),

      nextStep: () => {
        const { currentStep, visibleSteps } = get();
        const visible = visibleSteps();
        if (currentStep < visible.length - 1) set({ currentStep: currentStep + 1 });
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) set({ currentStep: currentStep - 1 });
      },

      goToStep: (index) => {
        const visible = get().visibleSteps();
        if (index >= 0 && index < visible.length) set({ currentStep: index });
      },

      reset: () => set({
        category: null, productId: null, schemaVersionId: null,
        currentStep: 0, selections: {}, draftId: null,
        estimatedPrice: null, completionPercent: 0, notes: '', referenceFiles: [],
      }),

      visibleSteps: () => {
        const { steps, selections } = get();
        return steps.filter(step => {
          if (!step.conditional?.show_if) return true;
          return Object.entries(step.conditional.show_if).every(
            ([key, val]) => selections[key] === val
          );
        });
      },

      isStepComplete: (stepId) => {
        const { steps, selections } = get();
        const step = steps.find(s => s.id === stepId);
        if (!step?.required) return true;
        return !!selections[stepId];
      },

      canProceed: () => {
        const { currentStep, visibleSteps, isStepComplete } = get();
        const visible = visibleSteps();
        const step = visible[currentStep];
        if (!step) return false;
        return isStepComplete(step.id);
      },
    }),
    {
      name: 'blikcart-configurator',
      partialize: (s) => ({
        draftId: s.draftId,
        selections: s.selections,
        quantity: s.quantity,
        notes: s.notes,
        category: s.category,
        productId: s.productId,
        currentStep: s.currentStep,
      }),
    }
  )
);
