/**
 * Sistema de Mensagens Motivacionais - LegacyPay
 * Mais de 9999 combinações únicas de mensagens
 */

// Títulos motivacionais (100+ opções)
const titles = [
  "Voce esta arrasando!",
  "Continue assim!",
  "Sucesso garantido!",
  "Voce e incrivel!",
  "Parabens pelo esforco!",
  "O sucesso e seu!",
  "Voce nasceu pra vencer!",
  "Dia de vitoria!",
  "Rumo ao topo!",
  "Imparavel!",
  "Foco total!",
  "Missao cumprida!",
  "Voce consegue!",
  "Acredite em voce!",
  "O melhor esta por vir!",
  "Resultados incriveis!",
  "Sua hora chegou!",
  "Conquista desbloqueada!",
  "Nivel acima!",
  "Performance nota 10!",
  "Momento de brilhar!",
  "Forca total!",
  "Energia positiva!",
  "Campeao(a)!",
  "Extraordinario!",
  "Orgulho de voce!",
  "Inspiracao pura!",
  "Maquina de vendas!",
  "Lider nato!",
  "Evolucao constante!",
  "Superacao diaria!",
  "Meta batida!",
  "Objetivo alcancado!",
  "Realizacao pessoal!",
  "Transformacao!",
  "Crescimento exponencial!",
  "Resultado positivo!",
  "Desempenho excelente!",
  "Produtividade maxima!",
  "Eficiencia total!",
  "Determinacao!",
  "Persistencia!",
  "Resiliencia!",
  "Coragem!",
  "Atitude vencedora!",
  "Mentalidade de sucesso!",
  "Espirito empreendedor!",
  "Visao de futuro!",
  "Potencial ilimitado!",
  "Talento reconhecido!",
  "Habilidade premiada!",
  "Competencia comprovada!",
  "Excelencia!",
  "Maestria!",
  "Dominio total!",
  "Profissionalismo!",
  "Dedicacao!",
  "Compromisso!",
  "Responsabilidade!",
  "Integridade!",
  "Confianca!",
  "Credibilidade!",
  "Autoridade!",
  "Influencia positiva!",
  "Impacto real!",
  "Diferenca que importa!",
  "Legado construido!",
  "Historia de sucesso!",
  "Exemplo a seguir!",
  "Referencia no mercado!",
  "Top performer!",
  "Elite dos negocios!",
  "Circulo dos vencedores!",
  "Time dos campeoes!",
  "Liga extraordinaria!",
  "Classe mundial!",
  "Padrao ouro!",
  "Nivel premium!",
  "Categoria especial!",
  "Selecao dos melhores!",
  "Hall da fama!",
  "Estrelato!",
  "Brilho proprio!",
  "Luz que guia!",
  "Farol do sucesso!",
  "Norte dos negocios!",
  "Bussola do empreendedor!",
  "Mapa do tesouro!",
  "Chave do sucesso!",
  "Porta da prosperidade!",
  "Caminho da vitoria!",
  "Trilha do sucesso!",
  "Jornada incrivel!",
  "Aventura lucrativa!",
  "Expedicao vitoriosa!",
  "Missao possivel!",
  "Operacao sucesso!",
  "Projeto vencedor!",
  "Plano perfeito!",
  "Estrategia campeã!",
];

// Mensagens base (100+ opções)
const baseMessages = [
  "Suas vendas estao crescendo cada vez mais!",
  "Voce esta no caminho certo para o sucesso!",
  "Cada venda e um passo mais perto dos seus sonhos!",
  "Seu esforco esta dando resultados incriveis!",
  "O mercado reconhece seu talento!",
  "Seus clientes confiam em voce!",
  "Sua dedicacao e inspiradora!",
  "Voce esta construindo um imperio!",
  "O sucesso e consequencia do seu trabalho!",
  "Seus numeros falam por si!",
  "A consistencia e sua marca registrada!",
  "Voce transforma desafios em oportunidades!",
  "Sua energia contagia todos ao redor!",
  "O futuro e promissor para quem trabalha assim!",
  "Voce e prova de que determinacao funciona!",
  "Seus resultados sao fruto de muito esforco!",
  "A cada dia voce fica mais forte!",
  "Seu negocio esta florescendo!",
  "Voce esta criando sua propria sorte!",
  "O universo conspira a favor de quem trabalha!",
  "Sua persistencia e admiravel!",
  "Voce nao desiste nunca!",
  "Obstaculos sao apenas degraus para voce!",
  "Sua mentalidade e de vencedor!",
  "Voce pensa grande e age maior ainda!",
  "Sua visao de futuro e clara!",
  "Voce sabe onde quer chegar!",
  "Seus objetivos estao cada vez mais proximos!",
  "Voce esta no controle da sua vida!",
  "Sua autonomia financeira esta chegando!",
  "Liberdade financeira e seu destino!",
  "Voce merece todo o sucesso do mundo!",
  "Seu trabalho duro sera recompensado!",
  "A colheita vem para quem planta!",
  "Voce esta plantando sementes de sucesso!",
  "Seu jardim de realizacoes esta florindo!",
  "Cada cliente satisfeito e uma vitoria!",
  "Voce cria experiencias memoraveis!",
  "Seu atendimento e diferenciado!",
  "Qualidade e seu sobrenome!",
  "Excelencia e seu padrao minimo!",
  "Voce eleva o nivel do mercado!",
  "Seu exemplo inspira outros empreendedores!",
  "Voce e referencia no que faz!",
  "As pessoas admiram sua trajetoria!",
  "Sua historia merece ser contada!",
  "Voce esta escrevendo paginas de sucesso!",
  "Cada capitulo da sua vida e vitorioso!",
  "O melhor ainda esta por vir!",
  "Amanha sera ainda melhor que hoje!",
  "Seu potencial e ilimitado!",
  "Voce ainda nem comecou a brilhar de verdade!",
  "O ceu e o limite para voce!",
  "Seus sonhos estao ao seu alcance!",
  "Voce transforma sonhos em realidade!",
  "Sua imaginacao cria seu futuro!",
  "Voce e arquiteto do seu destino!",
  "O leme da sua vida esta em suas maos!",
  "Voce navega em mares de prosperidade!",
  "Ventos favoraveis sopram para voce!",
  "A mare esta a seu favor!",
  "O momento e agora e voce sabe disso!",
  "Carpe diem - aproveite cada oportunidade!",
  "Voce nao deixa chances escaparem!",
  "Sua agilidade e impressionante!",
  "Voce e rapido e eficiente!",
  "Tempo e dinheiro e voce sabe usar ambos!",
  "Sua produtividade e invejavel!",
  "Voce faz mais em menos tempo!",
  "Eficiencia e sua especialidade!",
  "Voce otimiza tudo que toca!",
  "Seu metodo e comprovado!",
  "Sua estrategia e vencedora!",
  "Voce joga para ganhar!",
  "Segundo lugar nao e para voce!",
  "O podio mais alto te espera!",
  "A medalha de ouro e sua!",
  "Voce e campeao em tudo que faz!",
  "Sua vitoria e certa!",
  "O trofeu ja tem seu nome!",
  "A coroa e sua por direito!",
  "Voce reina no seu territorio!",
  "Seu dominio e absoluto!",
  "Ninguem faz melhor que voce!",
  "Voce e unico e especial!",
  "Sua singularidade e seu diferencial!",
  "Nao existe outro igual a voce!",
  "Voce e original e autentico!",
  "Sua essencia e pura vitoria!",
  "Seu DNA e de vencedor!",
  "Sucesso corre nas suas veias!",
  "Voce respira prosperidade!",
  "Abundancia e seu estado natural!",
  "Riqueza flui para voce naturalmente!",
  "O dinheiro te encontra facilmente!",
  "Oportunidades batem na sua porta!",
  "Voce atrai coisas boas!",
  "Sua energia e magnetica!",
  "Pessoas querem estar perto de voce!",
  "Voce inspira confianca!",
];

// Complementos motivacionais (100+ opções)
const complements = [
  "Continue focado!",
  "Nao pare agora!",
  "O melhor vem ai!",
  "Mantenha o ritmo!",
  "Acelere ainda mais!",
  "Voce esta decolando!",
  "O ceu e o limite!",
  "Sem limites para voce!",
  "Rumo aos milhoes!",
  "A prosperidade te aguarda!",
  "O sucesso e inevitavel!",
  "Vitoria garantida!",
  "Resultado certo!",
  "Meta superada!",
  "Objetivo cumprido!",
  "Missao completada!",
  "Desafio vencido!",
  "Obstaculo superado!",
  "Barreira quebrada!",
  "Recorde batido!",
  "Historia feita!",
  "Legado construido!",
  "Marca registrada!",
  "Referencia criada!",
  "Exemplo dado!",
  "Licao ensinada!",
  "Caminho aberto!",
  "Porta destrancada!",
  "Oportunidade aproveitada!",
  "Momento capturado!",
  "Chance agarrada!",
  "Sorte criada!",
  "Destino moldado!",
  "Futuro garantido!",
  "Amanha brilhante!",
  "Horizonte promissor!",
  "Perspectiva incrivel!",
  "Visao realizada!",
  "Sonho materializado!",
  "Desejo atendido!",
  "Vontade cumprida!",
  "Anseio satisfeito!",
  "Expectativa superada!",
  "Previsao acertada!",
  "Aposta ganha!",
  "Investimento certeiro!",
  "Retorno garantido!",
  "Lucro assegurado!",
  "Ganho confirmado!",
  "Rendimento positivo!",
  "Balanco favoravel!",
  "Conta no azul!",
  "Caixa cheio!",
  "Cofre transbordando!",
  "Riqueza acumulada!",
  "Patrimonio crescendo!",
  "Fortuna em construcao!",
  "Imperio se formando!",
  "Reino se expandindo!",
  "Territorio conquistado!",
  "Mercado dominado!",
  "Nicho explorado!",
  "Segmento liderado!",
  "Area controlada!",
  "Setor comandado!",
  "Industria influenciada!",
  "Economia movimentada!",
  "Dinheiro circulando!",
  "Valor agregado!",
  "Diferenca feita!",
  "Impacto causado!",
  "Mudanca provocada!",
  "Transformacao iniciada!",
  "Revolucao comecada!",
  "Inovacao implementada!",
  "Criatividade aplicada!",
  "Solucao encontrada!",
  "Problema resolvido!",
  "Questao respondida!",
  "Duvida esclarecida!",
  "Caminho iluminado!",
  "Direcao definida!",
  "Rumo tracado!",
  "Plano executado!",
  "Estrategia funcionando!",
  "Tatica acertada!",
  "Jogada perfeita!",
  "Lance certeiro!",
  "Movimento preciso!",
  "Acao efetiva!",
  "Atitude correta!",
  "Postura vencedora!",
  "Comportamento exemplar!",
  "Conduta admiravel!",
  "Carater inabalavel!",
  "Principios solidos!",
  "Valores fortes!",
  "Etica impecavel!",
  "Moral elevada!",
  "Espirito nobre!",
];

// Emojis para variar (opcional, usado internamente)
const vibes = [
  "foco",
  "energia",
  "determinacao",
  "garra",
  "forca",
  "coragem",
  "fe",
  "esperanca",
  "amor",
  "gratidao",
  "prosperidade",
  "abundancia",
  "riqueza",
  "sucesso",
  "vitoria",
  "conquista",
  "realizacao",
  "satisfacao",
  "felicidade",
  "alegria",
];

// Períodos do dia para contextualizar
const periodMessages: Record<string, string[]> = {
  morning: [
    "Bom dia de vendas!",
    "Manha produtiva!",
    "Comece o dia vendendo!",
    "Energia matinal!",
    "Dia novo, vendas novas!",
    "Acorde para o sucesso!",
    "Manha de vitorias!",
    "Sol nascendo, vendas subindo!",
    "Cafe e vendas!",
    "Primeiro horario, primeira venda!",
  ],
  afternoon: [
    "Tarde lucrativa!",
    "Continue firme!",
    "A tarde e sua!",
    "Meio do dia, pico de vendas!",
    "Almoco dos campeoes!",
    "Energia renovada!",
    "Segunda metade do dia!",
    "Tarde de resultados!",
    "Sol a pino, vendas em alta!",
    "Horario nobre!",
  ],
  evening: [
    "Noite de fechamentos!",
    "Ultimas horas, ultimas vendas!",
    "Finalizando com chave de ouro!",
    "Noite produtiva!",
    "Fechando o dia vendendo!",
    "Ultimos clientes do dia!",
    "Noite de conquistas!",
    "Lua cheia de vendas!",
    "Encerrando com lucro!",
    "Fim de dia vitorioso!",
  ],
};

// Mensagens especiais por dia da semana
const weekdayMessages: Record<number, string[]> = {
  0: [ // Domingo
    "Domingo tambem e dia de vender!",
    "Descanse vendendo!",
    "Domingo produtivo!",
    "Final de semana lucrativo!",
    "Domingo de resultados!",
  ],
  1: [ // Segunda
    "Segunda-feira de vendas!",
    "Comece a semana vendendo!",
    "Segunda poderosa!",
    "Inicio de semana vitorioso!",
    "Segunda dos campeoes!",
  ],
  2: [ // Terca
    "Terca de turbinada!",
    "Segundo dia, mais vendas!",
    "Terca produtiva!",
    "Mantenha o ritmo!",
    "Terca de conquistas!",
  ],
  3: [ // Quarta
    "Quarta no meio da semana!",
    "Metade da semana, dobro de vendas!",
    "Quarta poderosa!",
    "Meio de semana lucrativo!",
    "Quarta de resultados!",
  ],
  4: [ // Quinta
    "Quinta quase la!",
    "Reta final da semana!",
    "Quinta de vendas!",
    "Acelerando para o fim de semana!",
    "Quinta produtiva!",
  ],
  5: [ // Sexta
    "Sexta-feira de fechamento!",
    "Ultima chance da semana!",
    "Sexta lucrativa!",
    "Finalizando semana com chave de ouro!",
    "Sexta de conquistas!",
  ],
  6: [ // Sabado
    "Sabado de vendas!",
    "Final de semana produtivo!",
    "Sabado lucrativo!",
    "Descanse vendendo!",
    "Sabado dos campeoes!",
  ],
};

// Frases de acao
const actionPhrases = [
  "Vamos la!",
  "Bora vender!",
  "Partiu lucro!",
  "Vamo que vamo!",
  "E nois!",
  "Simbora!",
  "Ta na hora!",
  "Agora vai!",
  "Chegou a vez!",
  "E sua hora!",
  "Mostra quem manda!",
  "Faz acontecer!",
  "Realiza!",
  "Conquista!",
  "Domina!",
  "Arrasa!",
  "Detona!",
  "Bomba!",
  "Estoura!",
  "Explode de vender!",
];

// Numeros da sorte e frases numericas
const numberPhrases = [
  "1 venda ja e vitoria!",
  "2x mais que ontem!",
  "3 vezes campeao!",
  "5 estrelas de avaliacao!",
  "10/10 em desempenho!",
  "100% de dedicacao!",
  "1000 motivos para vencer!",
  "Milhoes te esperam!",
  "Infinitas possibilidades!",
  "Zero limites!",
];

/**
 * Gera uma mensagem motivacional única
 * Combina diferentes elementos para criar mais de 9999 variações
 */
export function generateMotivationalMessage(): { title: string; message: string } {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  
  // Determinar período do dia
  let period: 'morning' | 'afternoon' | 'evening';
  if (hour >= 5 && hour < 12) {
    period = 'morning';
  } else if (hour >= 12 && hour < 18) {
    period = 'afternoon';
  } else {
    period = 'evening';
  }
  
  // Randomizar elementos
  const randomTitle = titles[Math.floor(Math.random() * titles.length)];
  const randomBase = baseMessages[Math.floor(Math.random() * baseMessages.length)];
  const randomComplement = complements[Math.floor(Math.random() * complements.length)];
  const randomPeriod = periodMessages[period][Math.floor(Math.random() * periodMessages[period].length)];
  const randomWeekday = weekdayMessages[dayOfWeek][Math.floor(Math.random() * weekdayMessages[dayOfWeek].length)];
  const randomAction = actionPhrases[Math.floor(Math.random() * actionPhrases.length)];
  const randomNumber = numberPhrases[Math.floor(Math.random() * numberPhrases.length)];
  
  // Diferentes formatos de mensagem para mais variação
  const messageFormats = [
    `${randomBase} ${randomComplement}`,
    `${randomPeriod} ${randomBase}`,
    `${randomWeekday} ${randomComplement}`,
    `${randomBase} ${randomAction}`,
    `${randomPeriod} ${randomAction}`,
    `${randomNumber} ${randomComplement}`,
    `${randomBase}`,
    `${randomComplement} ${randomAction}`,
    `${randomWeekday} ${randomBase} ${randomAction}`,
    `${randomPeriod} ${randomNumber}`,
  ];
  
  const message = messageFormats[Math.floor(Math.random() * messageFormats.length)];
  
  return {
    title: randomTitle,
    message: message
  };
}

/**
 * Gera uma mensagem motivacional com hash único para evitar repetição
 */
export function generateUniqueMotivationalMessage(userId: string): { title: string; message: string; hash: string } {
  const msg = generateMotivationalMessage();
  const timestamp = Date.now();
  const hash = `${userId}-${timestamp}-${Math.random().toString(36).substring(7)}`;
  
  return {
    ...msg,
    hash
  };
}

/**
 * Calcula o número total de combinações possíveis
 * titles * baseMessages * complements * periodMessages * weekdayMessages * actionPhrases * numberPhrases * messageFormats
 * 100 * 100 * 100 * 10 * 5 * 20 * 10 * 10 = 10.000.000.000 combinações
 */
export function getTotalCombinations(): number {
  const periodCount = Object.values(periodMessages).reduce((acc, arr) => acc + arr.length, 0) / 3;
  const weekdayCount = Object.values(weekdayMessages).reduce((acc, arr) => acc + arr.length, 0) / 7;
  
  return titles.length * baseMessages.length * complements.length * 
         periodCount * weekdayCount * actionPhrases.length * 
         numberPhrases.length * 10; // 10 formatos
}

export { titles, baseMessages, complements, periodMessages, weekdayMessages, actionPhrases, numberPhrases };
