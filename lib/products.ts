export async function getProducts() {
  // 1. Cole aqui dentro das aspas o link CSV que você gerou no Google Sheets!
  const PLANILHA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSEBFXb1d_7KFNXVBxCiclQcVy4_EhBITqtjFDqxvCm4_fHhB5z6mshvP41Vkqck8LB0lvL7rffu7zw/pub?gid=0&single=true&output=csv";

  try {
    // Busca a planilha na web em tempo real (cache: 'no-store' garante dados frescos)
    const response = await fetch(PLANILHA_URL, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error("Não foi possível acessar a planilha online.");
    }
    
    const csvText = await response.text();

    // 2. Transforma o texto do CSV em uma lista estruturada
    const linhas = csvText.split('\n').filter(linha => linha.trim() !== '');
    if (linhas.length === 0) return [];

    // Descobre automaticamente se o Google exportou separando por vírgula ou ponto e vírgula
    const separador = linhas[0].includes(';') ? ';' : ',';
    
    // Pega os títulos das colunas (nome, preco, estoque, imagem...)
    const cabecalhos = linhas[0].split(separador).map(c => c.trim().toLowerCase());

    const produtos = linhas.slice(1).map((linha, index) => {
      // Regex segura para separar as colunas sem quebrar caso tenha vírgula no nome do perfume
      const regex = new RegExp(`(?:^|${separador})("([^"]*(?:""[^"]*)*)"|([^${separador}]+))`, 'g');
      
      // CORREÇÃO APLICADA AQUI: Avisamos que 'valores' é uma lista de textos (string[])
      const valores: string[] = []; 
      
      let match;
      
      while ((match = regex.exec(linha)) !== null) {
        let valor = match[2] || match[3] || '';
        valores.push(valor.replace(/""/g, '"').trim());
      }

      const produto: any = { id: `prod_${index}` }; // Cria um ID único
      
      cabecalhos.forEach((cabecalho, idx) => {
        if (cabecalho) {
          produto[cabecalho] = valores[idx] || '';
          
          // Se for preço, formata certinho
          if (cabecalho === 'preco') {
            const numeroLimpo = produto[cabecalho].replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
            produto[cabecalho] = Number(numeroLimpo) || 0;
          }
          
          // Se for estoque, converte para número
          if (cabecalho === 'estoque' || cabecalho === 'quantidade') {
            produto[cabecalho] = Number(produto[cabecalho]) || 0;
          }
        }
      });
      
      return produto;
    });

    return produtos;

  } catch (error) {
    console.error("Erro ao ler a planilha do Google Sheets:", error);
    return []; // Retorna lista vazia para o site não sair do ar se a planilha falhar
  }
}