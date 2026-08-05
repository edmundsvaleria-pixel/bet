import { useState, useEffect } from 'react'
import { useWallet } from '../../context/WalletContext'
import { useNotification } from '../../context/NotificationContext'
import ConfirmModal from '../common/ConfirmModal'

const WithdrawalRequests = () => {
  const { transactions, approveWithdrawal, rejectWithdrawal } = useWallet()
  const { showNotification } = useNotification()
  const [requests, setRequests] = useState([])
  const [selectedTx, setSelectedTx] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)

  useEffect(() => {
    const pending = transactions.filter(tx => tx.type === 'withdrawal' && tx.status === 'pending')
    setRequests(pending)
  }, [transactions])

  const handleApprove = (tx) => {
    setSelectedTx(tx)
    setShowApproveConfirm(true)
  }

  const confirmApprove = () => {
    if (selectedTx) {
      approveWithdrawal(selectedTx.id)
      showNotification(`Withdrawal of GHS ${selectedTx.amount.toFixed(2)} approved`, 'success')
      setSelectedTx(null)
      setShowApproveConfirm(false)
    }
  }

  const handleReject = (tx) => {
    setSelectedTx(tx)
    setRejectNote('')
    setShowRejectModal(true)
  }

  const confirmReject = () => {
    if (selectedTx) {
      if (!rejectNote.trim()) {
        showNotification('Please provide a reason for rejection', 'error')
        return
      }
      rejectWithdrawal(selectedTx.id, rejectNote)
      showNotification(`Withdrawal of GHS ${selectedTx.amount.toFixed(2)} rejected`, 'warning')
      setSelectedTx(null)
      setRejectNote('')
      setShowRejectModal(false)
    }
  }

  if (requests.length === 0) {
    return <div className="text-gray-400 text-center py-4">No pending withdrawal requests</div>
  }

  return (
    <>
      <div className="space-y-3">
        {requests.map((req, idx) => (
          <div key={idx} className="bg-dark/50 rounded-lg p-3 border border-white/5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-white font-medium">Amount: GHS {req.amount.toFixed(2)}</div>
                <div className="text-xs text-gray-400">Commission: GHS {req.commission?.toFixed(2) || '0.00'}</div>
                <div className="text-xs text-gray-400">Net: GHS {req.netAmount?.toFixed(2) || req.amount?.toFixed(2)}</div>
                <div className="text-xs text-gray-500">Reference: {req.commissionRef || 'N/A'}</div>
                <div className="text-xs text-gray-500">Date: {new Date(req.date).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(req)}
                  className="bg-green-500 hover:bg-green-400 text-white text-xs px-3 py-1 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(req)}
                  className="bg-red-500 hover:bg-red-400 text-white text-xs px-3 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Approve Confirmation Modal */}
      <ConfirmModal
        isOpen={showApproveConfirm}
        onClose={() => {
          setShowApproveConfirm(false)
          setSelectedTx(null)
        }}
        onConfirm={confirmApprove}
        title="Approve Withdrawal"
        message={`Approve withdrawal of GHS ${selectedTx?.amount?.toFixed(2)}? The user will receive GHS ${selectedTx?.netAmount?.toFixed(2)} after commission.`}
        confirmText="Approve"
        cancelText="Cancel"
        confirmColor="bg-green-500 hover:bg-green-600"
      />

      {/* Reject Modal with Note */}
      <ConfirmModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false)
          setSelectedTx(null)
          setRejectNote('')
        }}
        onConfirm={confirmReject}
        title="Reject Withdrawal"
        message={
          <div className="space-y-3">
            <p className="text-gray-300 text-sm">
              Reject withdrawal of GHS {selectedTx?.amount?.toFixed(2)}?
            </p>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Reason for rejection</label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                className="w-full bg-dark border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Enter reason for rejection..."
                rows="3"
              />
            </div>
          </div>
        }
        confirmText="Reject"
        cancelText="Cancel"
        confirmColor="bg-red-500 hover:bg-red-600"
      />
    </>
  )
}

export default WithdrawalRequests