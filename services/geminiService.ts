import { GoogleGenerativeAI } from "@google/generative-ai";
import { Project, Expense, Category } from "../types";

// Initialize the API client lazily
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

const getAiClient = () => {
  if (!apiKey) {
    throw new Error("API Key missing. Please configure VITE_GEMINI_API_KEY.");
  }
  return new GoogleGenerativeAI(apiKey);
};



export const generateProjectInsights = async (
  project: Project,
  expenses: Expense[],
  categories: Category[]
): Promise<string> => {
  if (!apiKey) {
    return "Chave de API não configurada. Adicione sua chave Gemini para obter insights.";
  }

  try {
    const totalSpent = expenses.reduce((sum, e) => sum + e.amountPaid, 0);
    const categoryMap = new Map<number, string>();
    categories.forEach(c => categoryMap.set(c.id!, c.name));

    // Summarize expenses by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(e => {
      const catName = categoryMap.get(e.categoryId) || 'Outros';
      expensesByCategory[catName] = (expensesByCategory[catName] || 0) + e.amountPaid;
    });

    const summary = JSON.stringify({
      projectName: project.name,
      budget: project.budget,
      totalSpent,
      percentageUsed: ((totalSpent / project.budget) * 100).toFixed(2),
      expensesByCategory
    });

    const prompt = `
      Atue como um consultor financeiro especialista em construção civil.
      Analise os dados deste projeto: ${summary}
      
      Forneça:
      1. Uma avaliação do andamento financeiro (está dentro do orçamento?).
      2. Alertas sobre categorias que parecem estar consumindo muito recurso.
      3. Uma dica prática para economizar nas próximas etapas.
      
      Responda em texto corrido, formatado com Markdown, em português do Brasil. Seja direto e breve (máximo 3 parágrafos).
    `;

    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || "Não foi possível gerar insights no momento.";

  } catch (error: any) {
    console.error("Erro ao gerar insights:", error);
    return "Ocorreu um erro ao consultar a IA. Verifique sua conexão ou chave de API.";
  }
};

export const classifyExpense = async (description: string): Promise<{ categoryId: number | null, reason: string }> => {
  return { categoryId: null, reason: "Funcionalidade de auto-classificação será implementada na v2." };
}

export interface ReceiptData {
  amount: number;
  date: string | null;
  supplier: string;
  description: string;
  categoryName: string;
}

export const analyzeReceipt = async (imageBase64: string, categories: Category[]): Promise<ReceiptData | null> => {
  if (!apiKey) return null;

  try {
    // Clean the base64 string to get raw data
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    // Prepare list of categories for the model to choose from
    const categoryList = categories.map(c => c.name).join(", ");

    const prompt = `
      Analise esta imagem de recibo/nota fiscal de construção civil.
      Extraia os seguintes dados e retorne APENAS um objeto JSON (sem markdown, sem \`\`\`json):
      
      {
        "amount": (número, valor total pago),
        "date": (string no formato YYYY-MM-DD, se não achar use null),
        "supplier": (string, nome da loja/fornecedor),
        "description": (string, resumo breve do que foi comprado ex: "5 sacos de cimento"),
        "categoryName": (string, escolha OBRIGATORIAMENTE a categoria mais adequada desta lista exata: [${categoryList}])
      }
    `;

    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);
    const response = await result.response;
    const text = response.text();

    if (!text) return null;

    // Sanitize and parse JSON
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr) as ReceiptData;

    return data;

  } catch (error: any) {
    console.error("Erro ao analisar recibo:", error);
    // Include error message in throw to help debugging in production
    throw new Error(`Falha na leitura: ${error.message || 'Erro desconhecido'}`);
  }
};

// --- NEW CALCULATOR FEATURE ---

export interface MaterialItem {
  name: string;
  quantity: string;
  estimatedPrice: string;
}

export const calculateMaterials = async (userPrompt: string): Promise<MaterialItem[]> => {
  if (!apiKey) throw new Error("API Key missing");

  const prompt = `
    Atue como um Engenheiro Civil Sênior e Orçamentista Especialista.
    
    TAREFA:
    Com base na solicitação do usuário: "${userPrompt}", elabore uma LISTA TÉCNICA COMPLETA DE MATERIAIS.
    
    REGRAS CRÍTICAS PARA A LISTA:
    1.  **Completude**: Não liste apenas o óbvio. Inclua itens auxiliares essenciais (ex: buchas, parafusos, vedantes, lixas, fitas, cola, pregos). Se for pintura, inclua rolos e proteção.
    2.  **Especificidade**: Use nomes técnicos e completos (ex: "Cimento CP-II" em vez de "Cimento"; "Parafuso GN 25mm" em vez de "Parafuso").
    3.  **Margem de Perda**: Já inclua automaticamente 10% de margem de segurança nas quantidades onde aplicável.
    4.  **Preço**: Estime o PREÇO UNITÁRIO MÉDIO DE MERCADO NO BRASIL (em Reais).
    
    FORMATO DE RESPOSTA (JSON PURO):
    Retorne APENAS um array JSON (sem markdown, sem \`\`\`json, sem texto antes ou depois).
    
    Schema do Objeto JSON:
    {
      "name": "Nome Técnico Completo do Material",
      "quantity": "Quantidade numérica + Unidade (ex: 5 sacos, 12 metros, 2 latas)",
      "estimatedPrice": "Preço Unitário (apenas números, ponto como decimal, ex: 35.50)"
    }
  `;

  try {
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        topK: 40,
        responseMimeType: "application/json",
      }
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text() || "[]";

    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr) as MaterialItem[];
  } catch (error: any) {
    console.error("Erro na calculadora:", error);
    return [];
  }
};