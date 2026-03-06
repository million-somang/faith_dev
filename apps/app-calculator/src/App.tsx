import { useState } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';

import TabBar from './components/TabBar';
import BasicCalc from './components/BasicCalc';
import ScientificCalc from './components/ScientificCalc';
import LoanCalc from './components/LoanCalc';
import BmiCalc from './components/BmiCalc';
import AgeCalc from './components/AgeCalc';
import DateCalc from './components/DateCalc';
import UnitCalc from './components/UnitCalc';
import PercentCalc from './components/PercentCalc';

function App() {
  const [activeTab, setActiveTab] = useState('basic');

  return (
    <MiniAppLayout title="">
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] p-2 sm:p-8 w-full">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-10 w-full max-w-5xl flex flex-col lg:flex-row gap-6 lg:gap-10 items-center justify-center">

          {/* Decorative Image Section */}
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-inner border border-blue-100 text-center">
            <div className="w-56 h-56 bg-white rounded-[40px] shadow-lg flex items-center justify-center mb-8 transform -rotate-3 transition-transform duration-300 hover:rotate-0 hover:scale-105">
              <i className="fas fa-calculator text-8xl text-blue-400"></i>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">스마트 다기능 계산기</h2>
            <p className="text-slate-500 mt-4 text-lg">기본 연산부터 대출, BMI, 단위 변환까지<br />일상의 모든 계산을 빠르고 정확하게.</p>
          </div>

          {/* Calculator Section */}
          <div className="flex-1 w-full max-w-md mx-auto">
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="calculator-content min-h-[500px] mt-6">
              {activeTab === 'basic' && <BasicCalc />}
              {activeTab === 'scientific' && <ScientificCalc />}
              {activeTab === 'loan' && <LoanCalc />}
              {activeTab === 'bmi' && <BmiCalc />}
              {activeTab === 'age' && <AgeCalc />}
              {activeTab === 'date' && <DateCalc />}
              {activeTab === 'unit' && <UnitCalc />}
              {activeTab === 'percent' && <PercentCalc />}
            </div>
          </div>

        </div>
      </div>
    </MiniAppLayout>
  );
}

export default App;
