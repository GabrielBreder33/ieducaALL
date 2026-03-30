const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface MaterialItem {
  id: number;
  professorId: number;
  professorNome: string;
  nome: string;
  descricao?: string;
  materiaId?: number;
  materiaNome?: string;
  tipo: string;
  questoesJson?: string;
  totalQuestoes: number;
  status: string;
  erroProcessamento?: string;
  ativo: boolean;
  criadoEm: string;
}

export interface QuestaoExtraida {
  numero: number;
  enunciado: string;
  alternativas: { letra: string; texto: string }[];
  gabarito?: string;
  explicacao?: string;
}

export interface QuestoesParseadas {
  questoes: QuestaoExtraida[];
  conteudo_extra?: string;
}

export const materialService = {
  async listarPorProfessor(professorId: number): Promise<MaterialItem[]> {
    const response = await fetch(`${API_URL}/Material/professor/${professorId}`);
    if (!response.ok) throw new Error('Erro ao buscar materiais');
    return response.json();
  },

  async buscarPorId(id: number): Promise<MaterialItem> {
    const response = await fetch(`${API_URL}/Material/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar material');
    return response.json();
  },

  async upload(formData: FormData): Promise<MaterialItem> {
    const response = await fetch(`${API_URL}/Material/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const msg = await response.text();
      throw new Error(msg || 'Erro ao enviar material');
    }
    return response.json();
  },

  async deletar(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/Material/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Erro ao deletar material');
  },

  async reprocessar(id: number): Promise<MaterialItem> {
    const response = await fetch(`${API_URL}/Material/${id}/reprocessar`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Erro ao reprocessar material');
    return response.json();
  },

  parseQuestoes(questoesJson?: string): QuestoesParseadas | null {
    if (!questoesJson) return null;
    try {
      // Limpar markdown code blocks
      let cleaned = questoesJson.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
      else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
      cleaned = cleaned.trim();

      try {
        return JSON.parse(cleaned);
      } catch {
        // JSON truncado - tentar reparar
        const repaired = this.repararJsonTruncado(cleaned);
        if (repaired) return JSON.parse(repaired);
        return null;
      }
    } catch {
      return null;
    }
  },

  repararJsonTruncado(json: string): string | null {
    // Encontrar a última questão completa (com gabarito fechado)
    const lastGabarito = json.lastIndexOf('"gabarito"');
    if (lastGabarito < 0) return null;

    // Procurar o } que fecha a questão após o gabarito
    let braces = 0;
    let endPos = -1;
    for (let i = lastGabarito; i < json.length; i++) {
      if (json[i] === '{') braces++;
      if (json[i] === '}') {
        if (braces > 0) { braces--; }
        else { endPos = i; break; }
      }
    }

    if (endPos < 0) {
      // Última questão incompleta - cortar antes dela
      // Achar o último '}' seguido de ','
      for (let i = json.length - 1; i >= 0; i--) {
        if (json[i] === '}') {
          const after = json.slice(i + 1).trim();
          if (after.startsWith(',') || after.startsWith(']')) {
            endPos = i;
            break;
          }
        }
      }
    }

    if (endPos > 0) {
      const repaired = json.slice(0, endPos + 1) + '\n    ]\n}';
      try {
        JSON.parse(repaired);
        return repaired;
      } catch { /* continuar para força bruta */ }
    }

    // Força bruta: contar brackets abertos e fechar
    const stack: string[] = [];
    let inStr = false;
    let esc = false;
    for (const c of json) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === '{' || c === '[') stack.push(c);
      else if (c === '}' && stack.length && stack[stack.length-1] === '{') stack.pop();
      else if (c === ']' && stack.length && stack[stack.length-1] === '[') stack.pop();
    }

    if (stack.length > 0) {
      let trimmed = json.trimEnd();
      if (inStr) trimmed += '"';
      while (trimmed.endsWith(',') || trimmed.endsWith(':'))
        trimmed = trimmed.slice(0, -1).trimEnd();
      const closing = stack.reverse().map(b => b === '{' ? '}' : ']').join('');
      const fixed = trimmed + closing;
      try {
        JSON.parse(fixed);
        return fixed;
      } catch { /* nada */ }
    }

    return null;
  },
};
