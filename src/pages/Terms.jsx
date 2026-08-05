import { Link } from 'react-router-dom'

const Terms = () => {
  return (
    <div className="py-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Terms & Conditions</h1>
      <div className="bg-card rounded-2xl p-6 border border-white/5 space-y-6 text-gray-300 text-sm leading-relaxed">
        
        <section>
          <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
          <p>
            By using BetZone ("the Platform"), you agree to be bound by these Terms & Conditions. 
            If you do not agree, please do not use the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">2. Eligibility</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>You must be at least 18 years old to use BetZone.</li>
            <li>You must be located in a jurisdiction where online betting is legal.</li>
            <li>Supported countries: Ghana, Nigeria, Kenya.</li>
            <li>You must provide accurate registration information.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">3. Account Registration</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Each user may only hold one account.</li>
            <li>You are responsible for maintaining your account credentials.</li>
            <li>You must notify us immediately of any unauthorized access.</li>
            <li>We reserve the right to suspend or terminate accounts.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">4. Deposits & Withdrawals</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Minimum Deposit:</strong> GHS 200</li>
            <li><strong>Minimum Withdrawal:</strong> GHS 10,000</li>
            <li><strong>Withdrawal Commission:</strong> 19% of withdrawal amount</li>
            <li>You must make at least 3 deposits before any withdrawal.</li>
            <li>100% of deposited funds must be used in bets before withdrawal eligibility.</li>
            <li>All transactions are processed securely via Paystack.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">5. Betting Rules</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>All bets are final once placed.</li>
            <li>Bets cannot be modified or canceled after confirmation.</li>
            <li>Winnings are credited to your withdrawable balance.</li>
            <li>In case of technical errors, we reserve the right to void bets.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">6. Responsible Gambling</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>BetZone promotes responsible gambling.</li>
            <li>You should only bet what you can afford to lose.</li>
            <li>Self-exclusion options are available.</li>
            <li>If you need help, contact gambling support organizations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">7. Prohibited Activities</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Fraudulent activities or money laundering.</li>
            <li>Using automated bots or scripts.</li>
            <li>Multiple accounts or identity fraud.</li>
            <li>Any form of cheating or manipulation.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">8. Privacy Policy</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Your personal data is stored securely.</li>
            <li>We do not share your data with third parties without consent.</li>
            <li>You may request data deletion at any time.</li>
            <li>Cookies are used for authentication and analytics.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">9. Liability</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>BetZone is provided "as is" without warranties.</li>
            <li>We are not liable for any losses incurred.</li>
            <li>We reserve the right to modify these terms at any time.</li>
            <li>Continued use constitutes acceptance of updated terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">10. Contact</h2>
          <p>
            For any questions regarding these Terms & Conditions, please contact us via the 
            <Link to="/support" className="text-primary hover:underline ml-1">Support</Link> page.
          </p>
        </section>

        <div className="border-t border-white/10 pt-4 mt-4">
          <p className="text-xs text-gray-500">
            Last Updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-xs text-gray-500 mt-1">Version 1.0</p>
        </div>
      </div>
    </div>
  )
}

export default Terms