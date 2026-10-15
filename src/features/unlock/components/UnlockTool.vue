<script setup>
import { ref, onMounted } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { downloadFile } from '../../../core/download.js';
import { removePassword, isPdfEncrypted } from '../logic/removePassword.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseInput from '../../../ui/BaseInput.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import UnlockResultCard from './UnlockResultCard.vue';

const activeFile = ref(null);
const password = ref('');
const isEncryptedDoc = ref(true);
const isProcessing = ref(false);
const progressVal = ref(0);
const unlockedResult = ref(null);

onMounted(() => {
  const c = queueState.value?.items?.find(i => i.name?.toLowerCase().endsWith('.pdf'));
  if (c?.file) loadDocument(c.file);
});

async function handleIncomingFiles(files) {
  const pdf = Array.from(files).find(f => f.name.toLowerCase().endsWith('.pdf'));
  if (pdf) await loadDocument(pdf);
}

async function loadDocument(file) {
  resetState();
  activeFile.value = file;
  try {
    const buffer = await file.arrayBuffer();
    isEncryptedDoc.value = await isPdfEncrypted(buffer);
    if (!isEncryptedDoc.value) showToast(t('tools.unlock.notEncryptedNotice'), 'info');
  } catch (err) {
    showToast(t('tools.unlock.failed', { reason: err.message || '' }), 'error');
  }
}

async function handleUnlock() {
  if (!activeFile.value) return;
  if (isEncryptedDoc.value && !password.value.trim()) {
    showToast(t('tools.unlock.emptyPassword'), 'warning');
    return;
  }
  isProcessing.value = true;
  progressVal.value = 40;
  try {
    const buffer = await activeFile.value.arrayBuffer();
    progressVal.value = 80;
    unlockedResult.value = await removePassword(buffer, password.value);
    showToast(t('tools.unlock.successTitle'), 'success');
  } catch (err) {
    const isPw = err.code === 'WRONG_PASSWORD';
    showToast(isPw ? t('tools.unlock.wrongPassword') : t('tools.unlock.failed', { reason: err.message || '' }), 'error');
  } finally {
    isProcessing.value = false;
  }
}

function handleDownload() {
  if (!unlockedResult.value || !activeFile.value) return;
  const safe = activeFile.value.name.replace(/\.pdf$/i, '');
  downloadFile(unlockedResult.value.unlockedBytes, `${safe}-terbuka.pdf`, 'application/pdf');
}

function resetState() {
  activeFile.value = null;
  password.value = '';
  isEncryptedDoc.value = true;
  unlockedResult.value = null;
  isProcessing.value = false;
  progressVal.value = 0;
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">{{ t('tools.unlock.title') }}</h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">{{ t('tools.unlock.desc') }}</p>
    </div>

    <DropZone v-if="!activeFile" @files="handleIncomingFiles" />

    <div v-else class="space-y-4">
      <BaseCard class="p-4 flex items-center justify-between">
        <div class="min-w-0">
          <h3 class="font-bold text-sm text-ink truncate">{{ activeFile.name }}</h3>
          <p class="text-xs text-ink/70">
            {{ (activeFile.size / 1024 / 1024).toFixed(2) }} MB
            <span v-if="!isEncryptedDoc" class="ml-2 font-bold text-accent-2 bg-black px-1.5 py-0.5 rounded-xs">TIDAK TERKUNCI</span>
          </p>
        </div>
        <button type="button" class="text-xs font-bold px-3 py-1.5 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer" @click="resetState">Ganti File</button>
      </BaseCard>

      <BaseProgressBar v-if="isProcessing" :progress="progressVal" label="Membuka kunci proteksi PDF..." />

      <BaseCard v-if="!unlockedResult" class="p-5 space-y-4">
        <div class="space-y-2">
          <label class="block text-xs font-bold text-ink uppercase">{{ t('tools.unlock.passwordLabel') }}</label>
          <BaseInput v-model="password" type="password" :placeholder="t('tools.unlock.passwordPlaceholder')" @keydown.enter="handleUnlock" />
        </div>
        <div class="p-3 border-2 border-ink bg-paper-dark text-xs text-ink/80 font-medium rounded-xs">⚖️ {{ t('tools.unlock.disclaimer') }}</div>
        <div class="flex justify-end pt-2">
          <BaseButton variant="primary" :loading="isProcessing" class="px-6 py-2.5 font-black text-xs" @click="handleUnlock">
            🔓 {{ t('tools.unlock.actionBtn') }}
          </BaseButton>
        </div>
      </BaseCard>

      <UnlockResultCard v-else :result="unlockedResult" @reset="resetState" @download="handleDownload" />
    </div>
  </div>
</template>
