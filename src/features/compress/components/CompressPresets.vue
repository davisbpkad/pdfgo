<script setup>
import { t } from '../../../app/providers/i18n.js';

defineProps({
  modelValue: {
    type: String,
    default: 'balanced'
  }
});

const emit = defineEmits(['update:modelValue']);

const presets = [
  {
    id: 'low',
    titleKey: 'tools.compress.presetLow',
    descKey: 'tools.compress.presetLowDesc',
    badge: null
  },
  {
    id: 'balanced',
    titleKey: 'tools.compress.presetBalanced',
    descKey: 'tools.compress.presetBalancedDesc',
    badgeKey: 'tools.compress.badgeRecommended'
  },
  {
    id: 'high',
    titleKey: 'tools.compress.presetHigh',
    descKey: 'tools.compress.presetHighDesc',
    badge: null
  }
];
</script>

<template>
  <div class="space-y-2">
    <label class="block text-xs font-black uppercase tracking-wider text-ink">
      {{ t('tools.compress.presetLabel') }}
    </label>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div
        v-for="p in presets"
        :key="p.id"
        class="border-3 border-ink p-4 flex flex-col justify-between cursor-pointer transition-all select-none"
        :class="modelValue === p.id ? 'bg-accent shadow-hard text-ink ring-2 ring-ink' : 'bg-paper text-ink/80 hover:bg-paper-dark shadow-hard-sm'"
        @click="emit('update:modelValue', p.id)"
      >
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="font-display font-black text-base">{{ t(p.titleKey) }}</span>
            <span v-if="p.badgeKey" class="text-2xs font-black bg-ink text-paper px-1.5 py-0.5 uppercase">
              {{ t(p.badgeKey) }}
            </span>
          </div>
          <p class="text-xs font-medium opacity-85 leading-relaxed">{{ t(p.descKey) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
