import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, BarChart3, Users, LineChart, CreditCard, Code2, Shield, Server, Headphones, Eye, Clock, Instagram, Youtube, Linkedin, Twitter, Check } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[150px]" />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,120,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,120,0,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">LP</span>
            </div>
            <span className="text-xl font-bold">LEGACY PAY</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#inicio" className="text-sm text-gray-400 hover:text-white transition-colors">Inicio</Link>
            <Link href="#solucoes" className="text-sm text-gray-400 hover:text-white transition-colors">Solucoes</Link>
            <Link href="#taxas" className="text-sm text-gray-400 hover:text-white transition-colors">Taxas</Link>
            <Link href="#docs" className="text-sm text-gray-400 hover:text-white transition-colors">Documentacao</Link>
            <Link href="#sobre" className="text-sm text-gray-400 hover:text-white transition-colors">Sobre nos</Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link href="/register" className="px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full text-sm font-medium text-black hover:shadow-lg hover:shadow-orange-500/25 transition-all">
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-6">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-sm text-orange-400">A NOVA GERACAO DE PAGAMENTOS</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                A nova geracao de{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">pagamentos</span>
                <br />comeca aqui.
              </h1>
              
              <p className="text-lg text-gray-400 mb-8 max-w-lg">
                Sua propria gateway completa, rapida, segura e escalavel.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-12">
                <Link href="/register" className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full font-medium text-black hover:shadow-xl hover:shadow-orange-500/30 transition-all">
                  Comecar agora
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="#demo" className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 rounded-full font-medium hover:bg-white/5 transition-all">
                  Ver demonstracao
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="flex flex-wrap items-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span>Ativacao rapida</span>
                  <span className="text-gray-600">em ate 5 minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-500" />
                  <span>Sem mensalidades</span>
                  <span className="text-gray-600">sem taxas escondidas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-orange-500" />
                  <span>Suporte premium</span>
                  <span className="text-gray-600">24h por dia</span>
                </div>
              </div>
            </div>
            
            {/* Right - Dashboard Mockup */}
            <div className="relative">
              <div className="relative bg-[#111111] rounded-2xl border border-white/10 p-4 shadow-2xl shadow-black/50">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded flex items-center justify-center">
                      <span className="text-black font-bold text-xs">LP</span>
                    </div>
                    <span className="text-sm font-semibold">LEGACY</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-xs">A</span>
                    </div>
                  </div>
                </div>
                
                {/* Dashboard Content */}
                <div className="bg-[#0d0d0d] rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-3">Resumo geral</div>
                  
                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500">Receita total</div>
                      <div className="text-lg font-bold text-white">R$ 98.765,43</div>
                      <div className="text-xs text-green-500">+8.2%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Transacoes</div>
                      <div className="text-lg font-bold text-white">12.543</div>
                      <div className="text-xs text-green-500">+8.2%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Aprovacao</div>
                      <div className="text-lg font-bold text-white">96,8%</div>
                      <div className="text-xs text-green-500">+2%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Chargebacks</div>
                      <div className="text-lg font-bold text-white">0,32%</div>
                      <div className="text-xs text-red-500">-0.1%</div>
                    </div>
                  </div>
                  
                  {/* Chart Area */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#151515] rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-2">Volume de vendas</div>
                      <div className="h-24 flex items-end gap-1">
                        {[40, 65, 45, 70, 55, 80, 60, 75, 85, 70, 90, 75].map((h, i) => (
                          <div key={i} className="flex-1 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="bg-[#151515] rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-2">Status das transacoes</div>
                      <div className="flex items-center justify-center h-24">
                        <div className="relative w-20 h-20">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="40" cy="40" r="35" stroke="#1f1f1f" strokeWidth="6" fill="none" />
                            <circle cx="40" cy="40" r="35" stroke="#f97316" strokeWidth="6" fill="none" strokeDasharray="200" strokeDashoffset="10" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold">96.8%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-2xl blur-xl -z-10" />
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-orange-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-orange-600/20 rounded-full blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="solucoes" className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-4">
              <span className="text-sm text-orange-400">SOLUCOES COMPLETAS</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold">
              Tudo que voce precisa para escalar seu negocio
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/10 transition-colors">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Pagamentos</h3>
              <h4 className="text-orange-500 font-medium mb-3">Instantaneos</h4>
              <p className="text-sm text-gray-500">
                Receba vendas via PIX e cartao com processamento rapido e seguro.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="group bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/10 transition-colors">
                <BarChart3 className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Automacao</h3>
              <h4 className="text-orange-500 font-medium mb-3">de Vendas.</h4>
              <p className="text-sm text-gray-500">
                Automatize entregas, acesse alunos e processos da sua operacao digital.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="group bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/10 transition-colors">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Gestao de</h3>
              <h4 className="text-orange-500 font-medium mb-3">Afiliados.</h4>
              <p className="text-sm text-gray-500">
                Crie e gerencie seu proprio programa de afiliados para escalar suas vendas.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="group bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/10 transition-colors">
                <LineChart className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Analytics em</h3>
              <h4 className="text-orange-500 font-medium mb-3">Tempo Real.</h4>
              <p className="text-sm text-gray-500">
                Acompanhe vendas, rentabilidade e desempenho do seu funil em dashboards intuitivos.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="group bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/10 transition-colors">
                <CreditCard className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Multiplas Formas</h3>
              <h4 className="text-orange-500 font-medium mb-3">de Pagamento.</h4>
              <p className="text-sm text-gray-500">
                Ofereca PIX, cartao de credito e outras opcoes para facilitar a compra.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="group bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/10 transition-colors">
                <Code2 className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-1">API Completa</h3>
              <h4 className="text-orange-500 font-medium mb-3">e Documentada.</h4>
              <p className="text-sm text-gray-500">
                Integre com sua aplicacao de forma simples e rapida com nossa API robusta e segura.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left content */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-4">
                  <span className="text-sm text-orange-400">DASHBOARD PODEROSO</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Controle total da sua operacao em{" "}
                  <span className="text-orange-500">tempo real.</span>
                </h2>
                <p className="text-gray-400 mb-8">
                  Dashboards avancados, graficos inteligentes e dados em tempo real para voce tomar decisoes rapidas e ganhar mais.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-orange-500/20 rounded flex items-center justify-center">
                      <Check className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-sm">Graficos em tempo real</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-orange-500/20 rounded flex items-center justify-center">
                      <Check className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-sm">Relatorios personalizados</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-orange-500/20 rounded flex items-center justify-center">
                      <Check className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-sm">Exportacao de dados</span>
                  </div>
                </div>
              </div>
              
              {/* Right - Dashboard Preview */}
              <div className="bg-[#0d0d0d] rounded-2xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm font-medium">Relatorio de vendas</div>
                  <div className="px-3 py-1 bg-[#1a1a1a] rounded text-xs">Hoje</div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-xs text-gray-500">Volume total</div>
                    <div className="text-lg font-bold">R$ 98.765,43</div>
                    <div className="text-xs text-green-500">+12.5%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Transacoes</div>
                    <div className="text-lg font-bold">12.543</div>
                    <div className="text-xs text-green-500">+8.2%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Ticket medio</div>
                    <div className="text-lg font-bold">R$ 78,90</div>
                    <div className="text-xs text-green-500">+5.4%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Novos clientes</div>
                    <div className="text-lg font-bold">2.356</div>
                    <div className="text-xs text-green-500">+15.3%</div>
                  </div>
                </div>
                
                {/* Charts */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 bg-[#151515] rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-2">Volume de vendas</div>
                    <div className="h-32 flex items-end gap-1">
                      {[30, 45, 35, 50, 40, 60, 45, 55, 65, 50, 70, 55, 75, 60, 80, 65, 85, 70, 90, 75, 85, 80, 95, 85].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                      <span>00:00</span>
                      <span>06:00</span>
                      <span>12:00</span>
                      <span>18:00</span>
                      <span>24:00</span>
                    </div>
                  </div>
                  <div className="bg-[#151515] rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-2">Transacoes por status</div>
                    <div className="flex items-center justify-center h-28">
                      <div className="relative w-24 h-24">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="48" cy="48" r="40" stroke="#1f1f1f" strokeWidth="8" fill="none" />
                          <circle cx="48" cy="48" r="40" stroke="#f97316" strokeWidth="8" fill="none" strokeDasharray="220" strokeDashoffset="15" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold">12.543</span>
                          <span className="text-xs text-gray-500">Total</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-orange-500 rounded-full" />
                          <span className="text-gray-500">Aprovadas</span>
                        </div>
                        <span>96.8%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                          <span className="text-gray-500">Pendentes</span>
                        </div>
                        <span>2.7%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span className="text-gray-500">Reprovadas</span>
                        </div>
                        <span>0.5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing/Fees Section */}
      <section id="taxas" className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-4">
              <span className="text-sm text-orange-400">TAXAS SIMPLES E TRANSPARENTES</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold">
              Estrutura de taxas que cabe no seu bolso
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* PIX */}
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-orange-500/20 transition-all">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Pix D+0</h3>
              <div className="text-2xl font-bold text-orange-500 mb-1">3,99% + R$2,00</div>
              <p className="text-sm text-gray-500">Receba na hora com taxa reduzida.</p>
            </div>
            
            {/* Credit Card - Highlighted */}
            <div className="relative bg-gradient-to-b from-orange-500/20 to-[#111111] border border-orange-500/30 rounded-2xl p-6">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 rounded-full text-xs font-medium text-black">
                A MELHOR CONDICAO
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 mt-2">
                <CreditCard className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Cartao de credito</h3>
              <div className="text-4xl font-bold text-orange-500 mb-1">0%+</div>
              <div className="text-2xl font-bold text-orange-500 mb-2">R$2,00</div>
              <p className="text-sm text-gray-500">Para grandes players.</p>
              <p className="text-xs text-gray-600 mt-2">Parcelamento em ate 12x</p>
            </div>
            
            {/* Boleto */}
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-orange-500/20 transition-all">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Boleto bancario</h3>
              <div className="text-2xl font-bold text-orange-500 mb-1">3,49% + R$2,00</div>
              <p className="text-sm text-gray-500">Compensacao rapida e sem burocracia.</p>
            </div>
            
            {/* Foreign Currency */}
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-orange-500/20 transition-all">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Moeda estrangeira</h3>
              <div className="text-2xl font-bold text-orange-500 mb-1">9,9% + R$2,00</div>
              <p className="text-sm text-gray-500">Venda em USD, EUR e GBP.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-4">
              <span className="text-sm text-orange-400">POR QUE ESCOLHER A LEGACY PAY?</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold">
              Feito para quem quer ir alem
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#111111] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-1">Seguranca maxima</h3>
              <p className="text-xs text-gray-500">Seus dados protegidos com criptografia avancada.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#111111] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Server className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-1">Infraestrutura robusta</h3>
              <p className="text-xs text-gray-500">Alta disponibilidade e escalabilidade.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#111111] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-1">Suporte 24/7</h3>
              <p className="text-xs text-gray-500">Time especializado sempre a disposicao.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#111111] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-1">Sem taxa escondida</h3>
              <p className="text-xs text-gray-500">Transparencia total em todas as operacoes.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#111111] border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="font-semibold mb-1">Ativacao rapida</h3>
              <p className="text-xs text-gray-500">Comece a usar em minutos, nao em dias.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-gradient-to-r from-[#1a0a00] to-[#0a0a0a] border border-orange-500/20 rounded-3xl p-8 lg:p-12 overflow-hidden">
            {/* Background glow */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-orange-500/10 to-transparent" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] bg-orange-500/20 rounded-full blur-[100px]" />
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Legacy Pay — nao e so uma gateway, e o{" "}
                  <span className="text-orange-500">proximo nivel.</span>
                </h2>
                <p className="text-gray-400 mb-6">
                  Transforme sua operacao, aumente suas conversoes e escale seu negocio com tecnologia de ponta.
                </p>
                <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full font-medium text-black hover:shadow-xl hover:shadow-orange-500/30 transition-all">
                  Criar minha conta agora
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-orange-500">+25K</div>
                  <div className="text-sm text-gray-500">Negocios ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-orange-500">+2.5M</div>
                  <div className="text-sm text-gray-500">Transacoes por mes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-orange-500">+R$ 1B</div>
                  <div className="text-sm text-gray-500">Processados por mes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Logo & Description */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold text-sm">LP</span>
                </div>
                <span className="text-xl font-bold">LEGACY PAY</span>
              </Link>
              <p className="text-sm text-gray-500 max-w-sm">
                A plataforma completa de pagamentos para negocios digitais e empresas que querem crescer.
              </p>
            </div>
            
            {/* Products */}
            <div>
              <h4 className="font-semibold mb-4">Produtos</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="#" className="hover:text-white transition-colors">Pagamentos</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Split de pagamentos</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Links de pagamento</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="#" className="hover:text-white transition-colors">Sobre nos</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Carreiras</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contato</Link></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="#" className="hover:text-white transition-colors">Documentacao</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Central de ajuda</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Status da API</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Fale conosco</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5">
            <div className="text-sm text-gray-500 mb-4 md:mb-0">
              Siga nossas redes
            </div>
            <div className="flex items-center gap-4">
              <Link href="#" className="w-10 h-10 bg-[#111111] border border-white/5 rounded-full flex items-center justify-center hover:border-orange-500/30 transition-colors">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 bg-[#111111] border border-white/5 rounded-full flex items-center justify-center hover:border-orange-500/30 transition-colors">
                <Youtube className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 bg-[#111111] border border-white/5 rounded-full flex items-center justify-center hover:border-orange-500/30 transition-colors">
                <Linkedin className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 bg-[#111111] border border-white/5 rounded-full flex items-center justify-center hover:border-orange-500/30 transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
            </div>
            <div className="text-sm text-gray-500 mt-4 md:mt-0">
              © 2024 Legacy Pay. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Globe(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
