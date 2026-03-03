import React, { useEffect, useState, useMemo } from 'react';
import { Users, Settings as SettingsIcon, BookOpen, Menu, Plus, Calendar, LayoutDashboard } from 'lucide-react';
import { getEmployees, getAssignments, saveAssignments, saveEmployee, deleteEmployee, clearAllData, syncFromGoogleSheets } from './services/storageService';
import { Employee, ShiftAssignment } from './types';
import StaffForm from './components/StaffForm';
import ScaleGrid from './components/ScaleGrid';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import RulesView from './components/RulesView';
import ReportsView from './components/ReportsView';
import { FileText } from 'lucide-react';
import ConfirmModal from './components/ConfirmModal';

enum ViewState {
    DASHBOARD = 'DASHBOARD',
    STAFF_LIST = 'STAFF_LIST',
    STAFF_FORM = 'STAFF_FORM',
    SCALE = 'SCALE',
    RULES = 'RULES',
    REPORTS = 'REPORTS',
    SETTINGS = 'SETTINGS'
}

const App: React.FC = () => {
    const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

    useEffect(() => {
        const initLoad = async () => {
            await syncFromGoogleSheets();
            setEmployees(getEmployees());
            setAssignments(getAssignments());
            setIsInitialLoading(false);
        };
        initLoad();
    }, []);

    useEffect(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        setCurrentWeekStart(monday);

        if (!isInitialLoading) {
            setEmployees(getEmployees());
            setAssignments(getAssignments());
        }
    }, [view, isInitialLoading]);

    const handleSaveEmployee = (emp: Employee) => {
        saveEmployee(emp);
        setEmployees(getEmployees());
        setView(ViewState.STAFF_LIST);
        setEditingEmployee(null);
    };

    const handleDeleteEmployee = (id: string) => {
        setEmployeeToDelete(id);
    };

    const confirmDeleteEmployee = () => {
        if (employeeToDelete) {
            deleteEmployee(employeeToDelete);
            setEmployees(getEmployees());
            setEmployeeToDelete(null);
        }
    };

    const handleAssignmentsChange = (newAssignments: ShiftAssignment[]) => {
        setAssignments(newAssignments);
        saveAssignments(newAssignments);
    };

    const renderContent = () => {
        if (isInitialLoading) {
            return (
                <div className="flex items-center justify-center h-full w-full">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gdf-primary mb-4"></div>
                        <p className="text-gray-500">Sincronizando com banco de dados...</p>
                    </div>
                </div>
            );
        }

        switch (view) {
            case ViewState.DASHBOARD:
                return (
                    <Dashboard 
                        employees={employees}
                        assignments={assignments}
                        startDate={currentWeekStart}
                    />
                );
            
            case ViewState.STAFF_LIST:
                return (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Cadastro de Servidores</h2>
                                <p className="text-xs text-gray-500">Gerencie a equipe do seu setor (Pronto Socorro Geral)</p>
                            </div>
                            <button 
                                onClick={() => { setEditingEmployee(null); setView(ViewState.STAFF_FORM); }}
                                className="bg-gdf-secondary text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-cyan-600 transition shadow-sm"
                            >
                                <Plus size={18} /> Novo Servidor
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Servidor</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cargo</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Restrições</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Carga Horária</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {employees.map(emp => (
                                        <tr key={emp.id} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`flex-shrink-0 h-9 w-9 rounded-full ${emp.colorIdentifier} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                                                        {emp.name.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-semibold text-gray-900">{emp.name}</div>
                                                        <div className="text-xs text-gray-500">{emp.matricula}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{emp.role}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {emp.preferences?.reducaoCarga > 0 && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mr-1">
                                                        Redução: {emp.preferences.reducaoCarga}h
                                                    </span>
                                                )}
                                                {emp.preferences?.prefersWeekends && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                        FDS
                                                    </span>
                                                )}
                                                {!emp.preferences?.reducaoCarga && !emp.preferences?.prefersWeekends && (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {emp.contractHours}h
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => { setEditingEmployee(emp); setView(ViewState.STAFF_FORM); }} className="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold">Editar</button>
                                                <button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-500 hover:text-red-700 font-semibold">Excluir</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {employees.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 bg-gray-50 border-dashed border-2 border-gray-200 rounded-lg m-4">
                                                <Users size={48} className="mx-auto mb-2 opacity-20" />
                                                <p>Nenhum servidor cadastrado.</p>
                                                <p className="text-sm">Clique em "Novo Servidor" para começar.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case ViewState.STAFF_FORM:
                return (
                    <StaffForm 
                        onSave={handleSaveEmployee} 
                        onCancel={() => setView(ViewState.STAFF_LIST)} 
                        initialData={editingEmployee}
                    />
                );

            case ViewState.SCALE:
                return (
                    <ScaleGrid 
                        employees={employees}
                        assignments={assignments}
                        onAssignmentChange={handleAssignmentsChange}
                        startDate={currentWeekStart}
                    />
                );
            
            case ViewState.SETTINGS:
                return <Settings />;

            case ViewState.RULES:
                return <RulesView />;

            case ViewState.REPORTS:
                return (
                    <ReportsView 
                        employees={employees}
                        assignments={assignments}
                        startDate={currentWeekStart}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-gdf-dark text-white hidden md:flex flex-col flex-shrink-0 transition-all duration-300 shadow-xl z-20">
                <div className="h-16 flex items-center justify-center border-b border-gray-700 bg-gdf-primary shadow-inner">
                    <span className="font-bold text-xl tracking-wider flex items-center gap-2">
                        SIS-ESCALA <span className="text-xs bg-white text-gdf-primary px-1 rounded">GDF</span>
                    </span>
                </div>
                
                <nav className="flex-1 px-3 py-6 space-y-1">
                    
                    <button 
                         onClick={() => setView(ViewState.DASHBOARD)}
                         className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 group ${view === ViewState.DASHBOARD ? 'bg-gray-700 text-gdf-accent shadow-lg translate-x-1' : 'hover:bg-gray-700 hover:text-white'}`}
                    >
                        <LayoutDashboard className={`mr-3 ${view === ViewState.DASHBOARD ? 'text-gdf-accent' : 'text-gray-400 group-hover:text-white'}`} size={20} />
                        Dashboard
                    </button>

                    <button 
                        onClick={() => setView(ViewState.STAFF_LIST)}
                        className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 group ${view === ViewState.STAFF_LIST || view === ViewState.STAFF_FORM ? 'bg-gray-700 text-gdf-accent shadow-lg translate-x-1' : 'hover:bg-gray-700 hover:text-white'}`}
                    >
                        <Users className={`mr-3 ${view === ViewState.STAFF_LIST || view === ViewState.STAFF_FORM ? 'text-gdf-accent' : 'text-gray-400 group-hover:text-white'}`} size={20} />
                        Servidores
                    </button>

                    <button 
                        onClick={() => setView(ViewState.SCALE)}
                        className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 group ${view === ViewState.SCALE ? 'bg-gray-700 text-gdf-accent shadow-lg translate-x-1' : 'hover:bg-gray-700 hover:text-white'}`}
                    >
                        <Calendar className={`mr-3 ${view === ViewState.SCALE ? 'text-gdf-accent' : 'text-gray-400 group-hover:text-white'}`} size={20} />
                        Escala Mensal
                    </button>

                    <button 
                        onClick={() => setView(ViewState.REPORTS)}
                        className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 group ${view === ViewState.REPORTS ? 'bg-gray-700 text-gdf-accent shadow-lg translate-x-1' : 'hover:bg-gray-700 hover:text-white'}`}
                    >
                        <FileText className={`mr-3 ${view === ViewState.REPORTS ? 'text-gdf-accent' : 'text-gray-400 group-hover:text-white'}`} size={20} />
                        Relatórios
                    </button>

                    <button 
                        onClick={() => setView(ViewState.RULES)}
                        className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 group ${view === ViewState.RULES ? 'bg-gray-700 text-gdf-accent shadow-lg translate-x-1' : 'hover:bg-gray-700 hover:text-white'}`}
                    >
                        <BookOpen className={`mr-3 ${view === ViewState.RULES ? 'text-gdf-accent' : 'text-gray-400 group-hover:text-white'}`} size={20} />
                        Regras & Portarias
                    </button>

                    <div className="pt-4 mt-4 border-t border-gray-700">
                        <button 
                            onClick={() => setView(ViewState.SETTINGS)}
                            className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 group ${view === ViewState.SETTINGS ? 'bg-gray-700 text-gdf-accent shadow-lg translate-x-1' : 'hover:bg-gray-700 hover:text-white'}`}
                        >
                            <SettingsIcon className={`mr-3 ${view === ViewState.SETTINGS ? 'text-gdf-accent' : 'text-gray-400 group-hover:text-white'}`} size={20} />
                            Configurações
                        </button>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-700 text-xs text-gray-400 text-center">
                    <p className="font-semibold">SES-DF / GDF</p>
                    <p className="opacity-75">v1.3.0</p>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 md:px-8 z-10">
                    <div className="md:hidden">
                        <Menu size={24} className="text-gray-600" />
                    </div>
                    <div className="flex-1 flex justify-end items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">Gestor de Setor</p>
                            <p className="text-xs text-gray-500">Acesso Restrito</p>
                        </div>
                        <div 
                            className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition"
                            onClick={() => setView(ViewState.SETTINGS)}
                        >
                            <SettingsIcon size={20} className="text-gray-600" />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 md:p-8">
                    {renderContent()}
                </main>
            </div>

            <ConfirmModal 
                isOpen={!!employeeToDelete}
                title="Excluir Servidor"
                message="Tem certeza que deseja excluir este servidor? Esta ação não pode ser desfeita."
                onConfirm={confirmDeleteEmployee}
                onCancel={() => setEmployeeToDelete(null)}
            />
        </div>
    );
};

export default App;