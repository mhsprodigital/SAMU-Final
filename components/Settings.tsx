import React, { useState, useEffect } from 'react';
import { UnitStructure } from '../types';
import { getUnits, saveUnits, clearAllData, getContractHoursOptions, saveContractHoursOptions, getGoogleScriptUrl, saveGoogleScriptUrl, syncFromGoogleSheets, syncToGoogleSheets } from '../services/storageService';
import { Plus, Trash2, Layers, AlertTriangle, RefreshCw, Briefcase, Clock, Database, UploadCloud, DownloadCloud } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const Settings: React.FC = () => {
    const [units, setUnits] = useState<UnitStructure[]>([]);
    const [newSectorName, setNewSectorName] = useState('');
    
    // Contract Hours State
    const [availableHours, setAvailableHours] = useState<number[]>([]);
    const [newHour, setNewHour] = useState<string>('');

    // Google Sheets State
    const [googleUrl, setGoogleUrl] = useState<string>('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    useEffect(() => {
        // Load Units/Sectors
        const loadedUnits = getUnits();
        if (loadedUnits.length === 0) {
            const defaultUnit: UnitStructure = { id: 'default', name: 'Instituição Padrão', sectors: [] };
            saveUnits([defaultUnit]);
            setUnits([defaultUnit]);
        } else {
            setUnits(loadedUnits);
        }

        // Load Hours
        setAvailableHours(getContractHoursOptions());

        // Load Google Script URL
        setGoogleUrl(getGoogleScriptUrl());
    }, []);

    // We assume the first unit is the "Current User's Unit" since we hid institution selection
    const activeUnit = units.length > 0 ? units[0] : null;

    // --- Sector Handlers ---
    const handleAddSector = () => {
        if (!activeUnit || !newSectorName.trim()) return;
        
        const updated = units.map(u => {
            if (u.id === activeUnit.id) {
                return { ...u, sectors: [...u.sectors, newSectorName] };
            }
            return u;
        });
        
        setUnits(updated);
        saveUnits(updated);
        setNewSectorName('');
    };

    const handleDeleteSector = (sectorName: string) => {
        if (!activeUnit) return;
        
        const updated = units.map(u => {
            if (u.id === activeUnit.id) {
                return { ...u, sectors: u.sectors.filter(s => s !== sectorName) };
            }
            return u;
        });
        
        setUnits(updated);
        saveUnits(updated);
    };

    // --- Hours Handlers ---
    const handleAddHour = () => {
        const hourVal = parseInt(newHour);
        if (isNaN(hourVal) || hourVal <= 0) return;
        if (availableHours.includes(hourVal)) return;

        const updated = [...availableHours, hourVal].sort((a, b) => a - b);
        setAvailableHours(updated);
        saveContractHoursOptions(updated);
        setNewHour('');
    };

    const handleDeleteHour = (hour: number) => {
        const updated = availableHours.filter(h => h !== hour);
        setAvailableHours(updated);
        saveContractHoursOptions(updated);
    };

    const handleResetSystem = () => {
        setIsResetModalOpen(true);
    };

    const confirmResetSystem = () => {
        clearAllData();
        window.location.reload();
    };

    const handleSaveGoogleUrl = () => {
        saveGoogleScriptUrl(googleUrl);
        setSyncMessage({ text: 'URL salva com sucesso!', type: 'success' });
        setTimeout(() => setSyncMessage(null), 3000);
    };

    const handleSyncToSheets = async () => {
        if (!googleUrl) {
            setSyncMessage({ text: 'Configure a URL primeiro.', type: 'error' });
            return;
        }
        setIsSyncing(true);
        setSyncMessage(null);
        try {
            await syncToGoogleSheets();
            setSyncMessage({ text: 'Dados enviados com sucesso!', type: 'success' });
        } catch (e) {
            setSyncMessage({ text: 'Erro ao enviar dados.', type: 'error' });
        } finally {
            setIsSyncing(false);
            setTimeout(() => setSyncMessage(null), 3000);
        }
    };

    const handleSyncFromSheets = async () => {
        if (!googleUrl) {
            setSyncMessage({ text: 'Configure a URL primeiro.', type: 'error' });
            return;
        }
        setIsSyncing(true);
        setSyncMessage(null);
        try {
            const success = await syncFromGoogleSheets();
            if (success) {
                setSyncMessage({ text: 'Dados importados com sucesso! Recarregando...', type: 'success' });
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setSyncMessage({ text: 'Nenhum dado encontrado ou erro na importação.', type: 'error' });
            }
        } catch (e) {
            setSyncMessage({ text: 'Erro ao importar dados.', type: 'error' });
        } finally {
            setIsSyncing(false);
            setTimeout(() => setSyncMessage(null), 3000);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Configurações do Setor</h2>
                <p className="text-gray-500 text-sm mt-1">Gerencie os setores e opções disponíveis para cadastro de servidores.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Sectors Management */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 h-full">
                     <h3 className="font-semibold text-gray-700 mb-6 flex items-center gap-2 text-lg border-b pb-2">
                        <Layers size={20} className="text-gdf-secondary"/> Meus Setores
                    </h3>

                    {activeUnit && (
                        <div>
                             <div className="flex gap-3 mb-6">
                                <input
                                    type="text"
                                    value={newSectorName}
                                    onChange={(e) => setNewSectorName(e.target.value)}
                                    placeholder="Ex: Sala Vermelha, UCIn..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gdf-secondary focus:outline-none"
                                />
                                <button 
                                    onClick={handleAddSector}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium shadow-sm transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                                {activeUnit.sectors.map((sector, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-1.5 rounded border border-gray-200 text-gray-500">
                                                <Briefcase size={14}/>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{sector}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteSector(sector)}
                                            className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                                            title="Remover Setor"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {activeUnit.sectors.length === 0 && (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                        <Layers size={32} className="mx-auto text-gray-300 mb-2"/>
                                        <p className="text-sm text-gray-500">Nenhum setor cadastrado.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Column 2: Contract Hours Management */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 h-full">
                    <h3 className="font-semibold text-gray-700 mb-6 flex items-center gap-2 text-lg border-b pb-2">
                        <Clock size={20} className="text-gdf-secondary"/> Cargas Horárias Permitidas
                    </h3>

                    <div className="flex gap-3 mb-6">
                        <input
                            type="number"
                            value={newHour}
                            onChange={(e) => setNewHour(e.target.value)}
                            placeholder="Ex: 12, 24, 44..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gdf-secondary focus:outline-none"
                        />
                        <button 
                            onClick={handleAddHour}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                        {availableHours.map((hour) => (
                            <div key={hour} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <span className="text-sm font-bold text-blue-800">{hour} Horas</span>
                                <button 
                                    onClick={() => handleDeleteHour(hour)}
                                    className="text-blue-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                                    title="Remover Carga Horária"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                     <p className="text-xs text-gray-400 mt-4">
                        * Esses valores aparecerão na lista suspensa ao cadastrar um novo servidor.
                    </p>
                </div>
            </div>

            {/* Google Sheets Integration */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mt-8">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2 text-lg border-b pb-2">
                    <Database size={20} className="text-green-600"/> Integração com Google Sheets
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Configure a URL do seu Google Apps Script para sincronizar todos os dados com uma planilha do Google.
                </p>
                
                <div className="flex gap-3 mb-4">
                    <input
                        type="url"
                        value={googleUrl}
                        onChange={(e) => setGoogleUrl(e.target.value)}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                    <button 
                        onClick={handleSaveGoogleUrl}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors font-medium text-sm"
                    >
                        Salvar URL
                    </button>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handleSyncToSheets}
                        disabled={isSyncing || !googleUrl}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        <UploadCloud size={18} /> Enviar para Planilha
                    </button>
                    <button 
                        onClick={handleSyncFromSheets}
                        disabled={isSyncing || !googleUrl}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        <DownloadCloud size={18} /> Importar da Planilha
                    </button>
                </div>

                {syncMessage && (
                    <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${syncMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        {syncMessage.text}
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-8">
                <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2">
                    <AlertTriangle size={20} /> Zona de Perigo
                </h3>
                <p className="text-red-700 text-sm mb-4">
                    As ações abaixo apagam todo o banco de dados local do navegador.
                </p>
                <button 
                    onClick={handleResetSystem}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 shadow-sm flex items-center gap-2"
                >
                    <RefreshCw size={18} /> Resetar Todo o Sistema
                </button>
            </div>

            <ConfirmModal 
                isOpen={isResetModalOpen}
                title="Resetar Sistema"
                message="ATENÇÃO: ISSO APAGARÁ TODOS OS DADOS (SERVIDORES, SETORES E CONFIGURAÇÕES). A ação não pode ser desfeita."
                onConfirm={confirmResetSystem}
                onCancel={() => setIsResetModalOpen(false)}
            />
        </div>
    );
};

export default Settings;