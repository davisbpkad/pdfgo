<script setup>
import { computed } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { buildAiPrompt, estimateTokens } from '../logic/formatAiPrompt.js';

const props = defineProps({
  fileName: { type: String, default: '' },
  extractedText: { type: String, default: '' },
  task: { type: String, default: 'summarize' },
  targetLang: { type: String, default: 'Bahasa Indonesia' },
  customInstruction: { type: String, default: '' }
});

const emit = defineEmits([
  'update:task',
  'update:targetLang',
  'update:customInstruction',
  'copy'
]);

const tasks = [
  { id: 'summarize', labelKey: 'tools.aiSummary.taskSummarize' },
  { id: 'translate', labelKey: 'tools.aiSummary.taskTranslate' },
  { id: 'action_items', labelKey: 'tools.aiSummary.taskActions' },
  { id: 'qa', labelKey: 'tools.aiSummary.taskQa' },
  { id: 'custom', labelKey: 'tools.aiSummary.taskCustom' }
];

const fullPrompt = computed(() =>
  buildAiPrompt({
    fileName: props.fileName,
    text: props.extractedText,
    task: props.task,
    targetLang: props.targetLang,
    customInstruction: props.customInstruction
  })
);

const estimatedTokenCount = computed(() => estimateTokens(fullPrompt.value));
</script>

<template>
  <div class="border-2 border-ink bg-paper p-5 shadow-hard rounded-sm space-y-4">
    <div class="space-y-1">
      <h3 class="font-display font-black text-base uppercase text-ink">
        {{ t('tools.aiSummary.step1Title') }}
      </h3>
      <p class="text-xs text-ink/75">
        {{ t('tools.aiSummary.step1Desc') }}
      </p>
    </div>

    <!-- Task Selector Buttons -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
      <button
        v-for="tk in tasks"
        :key="tk.id"
        type="button"
        class="border-2 border-ink p-2 text-xs font-bold rounded-sm transition-all cursor-pointer text-center"
        :class="task === tk.id ? 'bg-accent shadow-hard-sm' : 'bg-paper-dark/50 hover:bg-paper-dark'"
        @click="emit('update:task', tk.id)"
      >
        {{ t(tk.labelKey) }}
      </button>
    </div>

    <!-- Translation / Custom Options -->
    <div v-if="task === 'translate'" class="space-y-1">
      <label class="text-xs font-bold uppercase text-ink">{{ t('tools.aiSummary.targetLangLabel') }}</label>
      <input
        type="text"
        :value="targetLang"
        class="w-full border-2 border-ink px-3 py-1.5 text-xs bg-white rounded-sm font-sans"
        @input="emit('update:targetLang', $event.target.value)"
      />
    </div>

    <div v-else-if="task === 'custom'" class="space-y-1">
      <label class="text-xs font-bold uppercase text-ink">{{ t('tools.aiSummary.customLabel') }}</label>
      <textarea
        :value="customInstruction"
        rows="2"
        placeholder="Tuliskan instruksi spesifik untuk AI di sini..."
        class="w-full border-2 border-ink p-2 text-xs bg-white rounded-sm font-sans"
        @input="emit('update:customInstruction', $event.target.value)"
      />
    </div>

    <!-- Generated Prompt Box -->
    <div class="space-y-1">
      <div class="flex justify-between items-center text-[11px] text-ink/70">
        <span class="font-bold uppercase">{{ t('tools.aiSummary.promptPreview') }}</span>
        <span>{{ fullPrompt.length }} karakter &bull; ~{{ estimatedTokenCount }} token</span>
      </div>
      <textarea
        readonly
        :value="fullPrompt"
        rows="6"
        class="w-full border-2 border-ink bg-paper-dark/20 p-2.5 text-xs font-mono rounded-sm select-all"
      />
    </div>

    <button
      type="button"
      class="w-full py-2.5 px-4 border-2 border-ink bg-accent font-display font-black text-xs uppercase rounded-sm shadow-hard-sm hover:bg-accent/90 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
      @click="emit('copy', fullPrompt)"
    >
      📋 {{ t('tools.aiSummary.copyPromptBtn') }}
    </button>
  </div>
</template>
