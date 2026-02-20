'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    Plus,
    UserPlus,
    Mail,
    Phone,
    Calendar,
    MessageSquare,
    Gift,
    Clock
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useContacts } from '@/hooks/useContacts';
import { cn } from '@/lib/utils';
import type { Contact } from '@/types';
import { LoadingSpinner } from '@/components/ui/Loading';
import { AddContactModal } from '@/components/features/contacts/AddContactModal';
import { ContactDetailsModal } from '@/components/features/contacts/ContactDetailsModal';
import { formatDistanceToNow } from 'date-fns';

export default function ContactsPage() {
    const { contacts, loading } = useContacts();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<Contact['relationship'] | 'all'>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    const relationships: { id: Contact['relationship'] | 'all'; label: string }[] = [
        { id: 'all', label: 'All Contacts' },
        { id: 'family', label: 'Family' },
        { id: 'friend', label: 'Friends' },
        { id: 'colleague', label: 'Colleagues' },
        { id: 'acquaintance', label: 'Acquaintances' },
        { id: 'other', label: 'Other' },
    ];

    const filteredContacts = useMemo(() => {
        return contacts.filter((c) => {
            if (filterType !== 'all' && c.relationship !== filterType) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    c.name.toLowerCase().includes(query) ||
                    c.email?.toLowerCase().includes(query) ||
                    c.phone?.toLowerCase().includes(query) ||
                    c.tags?.some(tag => tag.toLowerCase().includes(query))
                );
            }
            return true;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [contacts, searchQuery, filterType]);

    const upcomingBirthdays = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return contacts
            .filter(c => c.birthday)
            .map(c => {
                const bday = new Date(c.birthday!);
                const currentYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());

                // If birthday has passed this year, look at next year
                if (currentYearBday < today) {
                    currentYearBday.setFullYear(today.getFullYear() + 1);
                }

                return {
                    contact: c,
                    date: currentYearBday,
                    daysUntil: Math.ceil((currentYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                };
            })
            .filter(item => item.daysUntil <= 30) // Only show upcoming within 30 days
            .sort((a, b) => a.daysUntil - b.daysUntil);
    }, [contacts]);

    return (
        <MainLayout>
            <PageContainer
                title="Contacts CRM"
                subtitle="Manage relationships, log interactions, and remember important dates"
                actions={
                    <Button variant="glow" leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setIsAddModalOpen(true)}>
                        Add Contact
                    </Button>
                }
            >
                <div className="flex flex-col xl:flex-row gap-6 mt-4">

                    {/* Main Area: Contacts List */}
                    <div className="flex-1 space-y-6">

                        {/* Filters & Search */}
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                                {relationships.map((rel) => {
                                    const isActive = filterType === rel.id;
                                    const count = rel.id === 'all'
                                        ? contacts.length
                                        : contacts.filter(c => c.relationship === rel.id).length;

                                    return (
                                        <button
                                            key={rel.id}
                                            onClick={() => setFilterType(rel.id)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-sm font-medium transition-all snap-start whitespace-nowrap border flex items-center gap-2",
                                                isActive
                                                    ? "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20"
                                                    : "bg-glass-light text-white/60 hover:text-white hover:bg-glass-medium border-transparent"
                                            )}
                                        >
                                            {rel.label}
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded-full text-[10px]",
                                                isActive ? "bg-neon-cyan/20 text-neon-cyan" : "bg-dark-600 text-white/40"
                                            )}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="relative md:w-64 flex-shrink-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Search contacts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-glass-light border border-glass-border rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/40 focus:bg-glass-medium transition-all"
                                />
                            </div>
                        </div>

                        {/* Contacts Grid */}
                        {loading ? (
                            <div className="py-20 flex justify-center">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : filteredContacts.length === 0 ? (
                            <Card variant="glass" className="py-20 text-center border-dashed">
                                <CardContent className="flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-glass-medium flex items-center justify-center mb-4">
                                        <Users className="w-8 h-8 text-white/20" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">No contacts found</h3>
                                    <p className="text-white/50 max-w-sm mb-6">
                                        {searchQuery ? "No contacts match your search criteria." : "Your contact list is empty. Add someone to start tracking relationships."}
                                    </p>
                                    <Button variant="glow" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsAddModalOpen(true)}>
                                        Add your first contact
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                                <AnimatePresence>
                                    {filteredContacts.map(contact => (
                                        <motion.div
                                            layout
                                            key={contact.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            onClick={() => setSelectedContact(contact)}
                                            className="bg-glass-light border border-glass-border p-4 rounded-xl hover:bg-glass-medium hover:border-white/10 transition-colors cursor-pointer group flex flex-col justify-between min-h-[140px]"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-semibold text-white group-hover:text-neon-cyan transition-colors">{contact.name}</h4>
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-semibold tracking-wider bg-dark-700 text-white/50 border border-glass-border">
                                                        {contact.relationship}
                                                    </span>
                                                </div>

                                                <div className="space-y-1.5 mt-3">
                                                    {contact.email && (
                                                        <div className="flex items-center gap-2 text-xs text-white/60">
                                                            <Mail className="w-3.5 h-3.5" />
                                                            <span className="truncate">{contact.email}</span>
                                                        </div>
                                                    )}
                                                    {contact.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-white/60">
                                                            <Phone className="w-3.5 h-3.5" />
                                                            <span>{contact.phone}</span>
                                                        </div>
                                                    )}
                                                    {contact.tags && contact.tags.length > 0 && (
                                                        <div className="flex gap-1 flex-wrap mt-2">
                                                            {contact.tags.slice(0, 3).map(tag => (
                                                                <span key={tag} className="px-1.5 py-0.5 rounded-sm bg-glass-medium text-[10px] text-white/40">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                            {contact.tags.length > 3 && (
                                                                <span className="px-1.5 py-0.5 rounded-sm bg-glass-medium text-[10px] text-white/40">
                                                                    +{contact.tags.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-glass-border flex items-center justify-between text-[11px] text-white/40">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {contact.lastContactAt ? (
                                                        <span>{formatDistanceToNow(contact.lastContactAt, { addSuffix: true })}</span>
                                                    ) : (
                                                        <span>Never contacted</span>
                                                    )}
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-neon-cyan font-medium flex items-center gap-1">
                                                    View details <span className="text-lg leading-none">&rsaquo;</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar: Quick Insights */}
                    <div className="xl:w-80 flex-shrink-0 space-y-4">
                        {/* Upcoming Birthdays Widget */}
                        <Card variant="glass">
                            <CardContent className="p-4">
                                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                    <Gift className="w-4 h-4 text-neon-pink" />
                                    Upcoming Birthdays
                                </h3>
                                {upcomingBirthdays.length === 0 ? (
                                    <p className="text-sm text-white/40 text-center py-4">No birthdays in the next 30 days.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {upcomingBirthdays.map((item) => (
                                            <div key={item.contact.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-neon-pink/10 flex items-center justify-center text-neon-pink font-semibold text-xs border border-neon-pink/20">
                                                        {item.contact.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white/90">{item.contact.name}</p>
                                                        <p className="text-[10px] text-white/50">{item.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-semibold text-neon-pink">
                                                        {item.daysUntil === 0 ? 'Today!' : `in ${item.daysUntil}d`}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Need to touch base */}
                        <Card variant="glass">
                            <CardContent className="p-4">
                                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-neon-cyan" />
                                    Needs Attention
                                </h3>
                                <p className="text-[11px] text-white/40 mb-3">Contacts you haven't spoken to recently.</p>
                                <div className="space-y-2">
                                    {contacts
                                        .filter(c => c.lastContactAt)
                                        .sort((a, b) => a.lastContactAt!.getTime() - b.lastContactAt!.getTime())
                                        .slice(0, 3)
                                        .map(contact => (
                                            <div key={contact.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/50 hover:bg-glass-medium cursor-pointer transition-colors" onClick={() => setSelectedContact(contact)}>
                                                <span className="text-sm font-medium text-white/80">{contact.name}</span>
                                                <span className="text-xs text-white/40">{formatDistanceToNow(contact.lastContactAt!, { addSuffix: true })}</span>
                                            </div>
                                        ))}
                                    {contacts.length > 0 && contacts.filter(c => c.lastContactAt).length === 0 && (
                                        <p className="text-sm text-white/40 text-center py-2">Log interactions to see insights here.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </PageContainer>

            <AddContactModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />

            {selectedContact && (
                <ContactDetailsModal
                    isOpen={!!selectedContact}
                    contact={selectedContact}
                    onClose={() => setSelectedContact(null)}
                />
            )}
        </MainLayout>
    );
}
