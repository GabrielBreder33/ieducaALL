import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Estudos from './pages/Aluno/Estudos';
import Atividade from './pages/Aluno/Atividade/AtividadeSimplificada';
import ExecutarAtividade from './pages/Aluno/Atividade/ExecutarAtividade';
import { AtividadeIAPage } from './pages/AtividadeIA';
import Redacao from './pages/Aluno/Redacao/Redacao';
import HistoricoRedacoes from './pages/Aluno/Redacao/HistoricoRedacoes';
import RedacaoCorrecaoView from './pages/Aluno/Redacao/RedacaoCorrecaoView';
import EscolaDashboard from './pages/Escola/Dashboard';
import ProfessorDashboard from './pages/Professor/Dashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/escola/dashboard" element={<EscolaDashboard />} />
        <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
        <Route path="/aluno/estudos" element={<Estudos />} />
        <Route path="/aluno/atividades" element={<Atividade />} />
        <Route path="/aluno/atividade/gerar-ia" element={<AtividadeIAPage />} />
        <Route path="/aluno/atividade/:id" element={<ExecutarAtividade />} />
        <Route path="/aluno/redacao" element={<Redacao />} />
        <Route path="/aluno/redacao/nova" element={<Redacao />} />
        <Route path="/aluno/redacao/historico" element={<HistoricoRedacoes />} />
        <Route path="/aluno/redacao/:id" element={<RedacaoCorrecaoView />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
