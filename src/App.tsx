import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import Login from './routes/Login';
import Dashboard from './routes/Dashboard';
import Customers from './routes/Customers';
import CustomerDetail from './routes/CustomerDetail';
import Loans from './routes/Loans';
import LoanDetail from './routes/LoanDetail';
import NewLoan from './routes/NewLoan';
import Payments from './routes/Payments';
import Collaterals from './routes/Collaterals';
import CollateralValuation from './routes/CollateralValuation';
import Reports from './routes/Reports';
import Settings from './routes/Settings';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/loans/new" element={<NewLoan />} />
          <Route path="/loans/:id" element={<LoanDetail />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/collaterals" element={<Collaterals />} />
          <Route path="/assets/:id/valuation" element={<CollateralValuation />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </Layout>
    </BrowserRouter>
  );
}

export default App;

