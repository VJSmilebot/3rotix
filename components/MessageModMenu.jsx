import { useState } from 'react';
import { Menu } from '@headlessui/react';

export function MessageModMenu({ message, onDelete, onMuteUser }) {
    return (
        <Menu as="div" className="relative">
            <Menu.Button className="text-gray-400 hover:text-gray-600">
                •••
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                <Menu.Item>
                    {({ active }) => (
                        <button
                            onClick={() => onDelete(message.id)}
                            className={`${
                                active ? 'bg-red-50 text-red-700' : 'text-red-600'
                            } flex w-full items-center px-4 py-2 text-sm`}
                        >
                            Delete Message
                        </button>
                    )}
                </Menu.Item>
                <Menu.Item>
                    {({ active }) => (
                        <button
                            onClick={() => onMuteUser(message.userId)}
                            className={`${
                                active ? 'bg-yellow-50 text-yellow-700' : 'text-yellow-600'
                            } flex w-full items-center px-4 py-2 text-sm`}
                        >
                            Mute User
                        </button>
                    )}
                </Menu.Item>
            </Menu.Items>
        </Menu>
    );
}