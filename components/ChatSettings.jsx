import { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';

export function ChatSettings({ squadId, isLeader }) {
    const [settings, setSettings] = useState({
        isOpen: true,
        permissions: [],
        perks: []
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadChatSettings();
    }, [squadId]);

    async function loadChatSettings() {
        try {
            const response = await fetch(`/api/squads/${squadId}/chat/settings`);
            const data = await response.json();
            setSettings(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load chat settings:', error);
        }
    }

    async function toggleChatStatus() {
        try {
            await fetch(`/api/squads/${squadId}/chat/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isOpen: !settings.isOpen })
            });
            setSettings(prev => ({ ...prev, isOpen: !prev.isOpen }));
        } catch (error) {
            console.error('Failed to toggle chat:', error);
        }
    }

    async function updatePerkLevel(permission, level) {
        try {
            await fetch(`/api/squads/${squadId}/chat/perks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permission, requiredLevel: level })
            });
            await loadChatSettings();
        } catch (error) {
            console.error('Failed to update perk:', error);
        }
    }

    if (!isLeader) return null;
    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Chat Settings</h2>
            
            <div className="space-y-6">
                {/* Chat Status */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium">Chat Status</h3>
                        <p className="text-sm text-gray-500">
                            {settings.isOpen ? 'Chat is open' : 'Chat is closed'}
                        </p>
                    </div>
                    <Switch
                        checked={settings.isOpen}
                        onChange={toggleChatStatus}
                        className={`${settings.isOpen ? 'bg-blue-600' : 'bg-gray-200'} 
                            relative inline-flex h-6 w-11 items-center rounded-full`}
                    >
                        <span className="sr-only">Toggle chat</span>
                        <span
                            className={`${settings.isOpen ? 'translate-x-6' : 'translate-x-1'}
                                inline-block h-4 w-4 transform rounded-full bg-white transition`}
                        />
                    </Switch>
                </div>

                {/* Chat Perks */}
                <div>
                    <h3 className="font-medium mb-2">Chat Perks</h3>
                    <div className="space-y-4">
                        {settings.perks.map(perk => (
                            <div key={perk.permission} className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="font-medium">{perk.permission}</div>
                                    <div className="text-sm text-gray-500">
                                        Required Level: {perk.requiredLevel}
                                    </div>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    value={perk.requiredLevel}
                                    onChange={(e) => updatePerkLevel(perk.permission, e.target.value)}
                                    className="w-20 rounded border p-1"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Moderation Tools */}
                <div>
                    <h3 className="font-medium mb-2">Quick Actions</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSettings(prev => ({ ...prev, isOpen: false }))}
                            className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm"
                        >
                            Pause Chat
                        </button>
                        <button
                            onClick={() => setSettings(prev => ({ ...prev, permissions: ['TEXT'] }))}
                            className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-lg text-sm"
                        >
                            Text Only Mode
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}