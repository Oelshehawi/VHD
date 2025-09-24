"use client";
import { useState, createContext, useContext, ReactNode } from "react";
import CallLogModal from "../database/CallLogModal";
import CallHistoryModal from "../database/CallHistoryModal";
import { CallLogEntry } from "../../app/lib/typeDefinitions";

interface CallLogContextType {
  openCallLog: (context: {
    type: 'job' | 'invoice';
    id: string;
    title: string;
    clientName?: string;
  }) => void;
  openCallHistory: (callHistory: CallLogEntry[], jobTitle: string) => void;
}

const CallLogContext = createContext<CallLogContextType | null>(null);

export const useCallLog = () => {
  const context = useContext(CallLogContext);
  if (!context) {
    throw new Error("useCallLog must be used within CallLogProvider");
  }
  return context;
};

interface CallLogProviderProps {
  children: ReactNode;
}

export const CallLogProvider = ({ children }: CallLogProviderProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState<{
    type: 'job' | 'invoice';
    id: string;
    title: string;
    clientName?: string;
  } | null>(null);

  // Call History Modal state
  const [callHistoryOpen, setCallHistoryOpen] = useState(false);
  const [callHistoryData, setCallHistoryData] = useState<{
    callHistory: CallLogEntry[];
    jobTitle: string;
  }>({ callHistory: [], jobTitle: '' });

  const openCallLog = (context: {
    type: 'job' | 'invoice';
    id: string;
    title: string;
    clientName?: string;
  }) => {
    setModalContext(context);
    setModalOpen(true);
  };

  const openCallHistory = (callHistory: CallLogEntry[], jobTitle: string) => {
    setCallHistoryData({ callHistory, jobTitle });
    setCallHistoryOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalContext(null);
  };

  const closeCallHistory = () => {
    setCallHistoryOpen(false);
    setCallHistoryData({ callHistory: [], jobTitle: '' });
  };


  return (
    <CallLogContext.Provider value={{ openCallLog, openCallHistory }}>
      {children}
      <CallLogModal
        open={modalOpen}
        onClose={closeModal}
        context={modalContext || {
          type: 'job',
          id: '',
          title: '',
          clientName: ''
        }}
      />
      <CallHistoryModal
        open={callHistoryOpen}
        onClose={closeCallHistory}
        callHistory={callHistoryData.callHistory}
        jobTitle={callHistoryData.jobTitle}
      />
    </CallLogContext.Provider>
  );
};