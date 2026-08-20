"use client";

import { useEffect, useState } from "react";
import { Client } from "@/types";
import { formatCurrency } from "@/lib/utils";
import ClientForm from "@/components/clients/ClientForm";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "lead">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Load clients
  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Failed to load clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSave = async (clientData: any) => {
    try {
      const method = selectedClient ? "PUT" : "POST";
      const url = selectedClient ? `/api/clients/${selectedClient.id}` : "/api/clients";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });

      if (res.ok) {
        setIsFormOpen(false);
        setSelectedClient(null);
        fetchClients();
      }
    } catch (error) {
      console.error("Failed to save client:", error);
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  // Filter & search logic
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && c.status === "active") ||
      (filter === "lead" && c.status === "lead");

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Search & Filters & New Client Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search by name, company, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border focus:border-border-accent rounded-md pl-9 pr-3 py-2.5 text-xs text-text-primary placeholder:text-text-tertiary outline-none transition-colors"
          />
        </div>

        {/* Filters & Trigger Form Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex gap-0.5 bg-subtle p-1 rounded-md">
            <button
              onClick={() => setFilter("all")}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-md transition-all ${
                filter === "all" ? "bg-elevated text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-md transition-all ${
                filter === "active" ? "bg-elevated text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter("lead")}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-md transition-all ${
                filter === "lead" ? "bg-elevated text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Leads
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedClient(null);
              setIsFormOpen(true);
            }}
            className="bg-accent text-[#0C0C0E] text-[11px] font-semibold px-4 py-2.5 rounded-md hover:brightness-110 active:scale-[0.98] transition-all whitespace-nowrap"
          >
            + New Client
          </button>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-10 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 bg-subtle rounded-lg flex items-center justify-center text-[18px]">
            👥
          </div>
          <h3 className="text-sm font-semibold text-text-primary">No clients found</h3>
          <p className="text-xs text-text-secondary max-w-xs">
            Start by creating a new client to log billable hours and generate invoices.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="mt-2 bg-accent text-[#0C0C0E] text-[11px] font-semibold px-4 py-2 rounded-md hover:brightness-110 transition-all"
          >
            + Add Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            // Initials helper
            const initials = client.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();

            // Avatar styling mapping based on status
            const avatarStyles =
              client.status === "active"
                ? "bg-info/10 text-info"
                : client.status === "lead"
                ? "bg-accent/10 text-accent"
                : "bg-subtle text-text-secondary";

            // Badge class helper
            const badgeClass =
              client.status === "active"
                ? "bg-success/10 text-success"
                : client.status === "lead"
                ? "bg-accent/10 text-accent"
                : "bg-subtle text-text-tertiary";

            return (
              <div
                key={client.id}
                className="bg-surface border border-border rounded-lg p-5 hover:border-border-strong transition-all duration-150 flex flex-col"
              >
                {/* Avatar & Title Row */}
                <div className="flex gap-3 items-center mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarStyles}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-text-primary truncate">
                      {client.name}
                    </h3>
                    <p className="text-xs text-text-secondary truncate">
                      {client.company || "Individual"}
                    </p>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${badgeClass}`}>
                    {client.status}
                  </span>
                </div>

                <hr className="border-border/60 mb-3" />

                {/* Details list */}
                <div className="flex flex-col gap-1.5 mb-5 flex-1">
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Total billed</span>
                    <span className="font-mono text-text-primary">
                      {formatCurrency(Number(client.total_billed) || 0, client.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Currency preference</span>
                    <span className="text-text-primary font-mono text-[11px]">{client.currency}</span>
                  </div>
                  {client.email && (
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span>Email</span>
                      <span className="text-text-primary truncate max-w-[140px]">{client.email}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-auto">
                  <Link
                    href={`/clients/${client.id}`}
                    className="bg-transparent border border-border-strong text-text-primary text-[10px] font-semibold py-2 px-3 rounded-md hover:bg-subtle transition-all text-center flex-1"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={() => handleEdit(client)}
                    className="bg-accent text-[#0C0C0E] text-[10px] font-semibold py-2 px-3 rounded-md hover:brightness-110 active:scale-[0.98] transition-all flex-1"
                  >
                    Edit Info
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      {isFormOpen && (
        <ClientForm
          client={selectedClient}
          onSave={handleSave}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedClient(null);
          }}
        />
      )}
    </div>
  );
}
