import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage(): ReactNode {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: April 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          <p>
            This Privacy Notice for ReminderToday (&quot;we,&quot; &quot;us,&quot; or
            &quot;our&quot;), describes how and why we might access, collect, store, use, and/or
            share (&quot;process&quot;) your personal information when you use our services
            (&quot;Services&quot;), including when you:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Visit our website at www.remindertoday.com or any website of ours that links to this
              Privacy Notice
            </li>
            <li>
              Download and use our mobile application (ReminderToday), or any other application of
              ours that links to this Privacy Notice
            </li>
            <li>Engage with us in other related ways, including any marketing or events</li>
          </ul>
          <p>
            Questions or concerns? Reading this Privacy Notice will help you understand your privacy
            rights and choices. We are responsible for making decisions about how your personal
            information is processed. If you do not agree with our policies and practices, please do
            not use our Services. If you still have any questions or concerns, please contact us at{' '}
            <a
              href="mailto:support@remindertoday.com"
              className="text-[#6498c8] hover:underline"
            >
              support@remindertoday.com
            </a>
            .
          </p>

          <Section title="Summary of Key Points">
            <p>
              This summary provides key points from our Privacy Notice, but you can find out more
              details about any of these topics by reading the full sections below.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-gray-900 dark:text-gray-100">
                  What personal information do we process?
                </strong>{' '}
                When you visit, use, or navigate our Services, we may process personal information
                depending on how you interact with us and the Services, the choices you make, and the
                products and features you use.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">
                  Do we process any sensitive personal information?
                </strong>{' '}
                We do not process sensitive personal information.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">
                  Do we collect any information from third parties?
                </strong>{' '}
                We do not collect any information from third parties.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">
                  How do we process your information?
                </strong>{' '}
                We process your information to provide, improve, and administer our Services,
                communicate with you, for security and fraud prevention, and to comply with law.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">
                  How do we keep your information safe?
                </strong>{' '}
                We have adequate organizational and technical processes and procedures in place to
                protect your personal information. However, no electronic transmission over the
                internet or information storage technology can be guaranteed to be 100% secure.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">What are your rights?</strong>{' '}
                Depending on where you are located geographically, the applicable privacy law may
                mean you have certain rights regarding your personal information.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">
                  How do you exercise your rights?
                </strong>{' '}
                The easiest way to exercise your rights is by submitting a data subject access
                request, or by contacting us.
              </li>
            </ul>
          </Section>

          <Section title="1. What Information Do We Collect?">
            <p>
              <strong className="text-gray-900 dark:text-gray-100">In Short:</strong> We collect
              personal information that you provide to us.
            </p>
            <p>
              We collect personal information that you voluntarily provide to us when you register on
              the Services, express an interest in obtaining information about us or our products and
              Services, when you participate in activities on the Services, or otherwise when you
              contact us.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-gray-100">
                Personal Information Provided by You.
              </strong>{' '}
              The personal information we collect may include email addresses.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-gray-100">Sensitive Information.</strong>{' '}
              We do not process sensitive information.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-gray-100">Payment Data.</strong> We may
              collect data necessary to process your payment if you choose to make purchases, such as
              your payment instrument number and the security code associated with your payment
              instrument. All payment data is handled and stored by{' '}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6498c8] hover:underline"
              >
                Stripe
              </a>
              .
            </p>
            <p>
              <strong className="text-gray-900 dark:text-gray-100">Application Data.</strong> If you
              use our application(s), we also may collect the following information if you choose to
              provide us with access or permission:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-gray-900 dark:text-gray-100">
                  Mobile Device Access.
                </strong>{' '}
                We may request access or permission to certain features from your mobile device,
                including your mobile device&apos;s reminders and other features.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">Mobile Device Data.</strong> We
                automatically collect device information (such as your mobile device ID, model, and
                manufacturer), operating system, version information and system configuration
                information, device and application identification numbers, browser type and version,
                hardware model, Internet service provider and/or mobile carrier, and Internet
                Protocol (IP) address.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-gray-100">Push Notifications.</strong> We
                may request to send you push notifications regarding your account or certain features
                of the application(s). You may turn them off in your device&apos;s settings.
              </li>
            </ul>
            <p>
              <strong className="text-gray-900 dark:text-gray-100">
                Information automatically collected.
              </strong>{' '}
              Some information — such as your Internet Protocol (IP) address and/or browser and
              device characteristics — is collected automatically when you visit our Services. This
              information does not reveal your specific identity but may include device and usage
              information, such as your IP address, browser and device characteristics, operating
              system, language preferences, referring URLs, device name, country, location,
              information about how and when you use our Services, and other technical information.
            </p>
            <p>
              Like many businesses, we also collect information through cookies and similar
              technologies. The information we collect includes log and usage data, device data, and
              location data.
            </p>
          </Section>

          <Section title="2. How Do We Process Your Information?">
            <p>
              <strong className="text-gray-900 dark:text-gray-100">In Short:</strong> We process
              your information to provide, improve, and administer our Services, communicate with
              you, for security and fraud prevention, and to comply with law.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>To facilitate account creation and authentication and manage user accounts</li>
              <li>To deliver and facilitate delivery of services to the user</li>
              <li>To respond to user inquiries/offer support to users</li>
              <li>To send administrative information to you</li>
              <li>To fulfill and manage your orders</li>
              <li>To save or protect an individual&apos;s vital interest</li>
            </ul>
          </Section>

          <Section title="3. What Legal Bases Do We Rely On to Process Your Information?">
            <p>
              <strong className="text-gray-900 dark:text-gray-100">In Short:</strong> We only
              process your personal information when we believe it is necessary and we have a valid
              legal reason to do so under applicable law, like with your consent, to comply with
              laws, to provide you with services, to protect your rights, or to fulfill our
              legitimate business interests.
            </p>
            <p>
              <em>If you are located in the EU or UK:</em> The General Data Protection Regulation
              (GDPR) and UK GDPR require us to explain the valid legal bases we rely on. These
              include: Consent, Performance of a Contract, Legal Obligations, and Vital Interests.
            </p>
            <p>
              <em>If you are located in Canada:</em> We may process your information if you have
              given us specific permission (express consent) to use your personal information for a
              specific purpose, or in situations where your permission can be inferred (implied
              consent). You can withdraw your consent at any time.
            </p>
          </Section>

          <Section title="4. When and With Whom Do We Share Your Personal Information?">
            <p>
              <strong className="text-gray-900 dark:text-gray-100">In Short:</strong> We may share
              information in specific situations described in this section.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-gray-100">Business Transfers.</strong> We
              may share or transfer your information in connection with, or during negotiations of,
              any merger, sale of company assets, financing, or acquisition of all or a portion of
              our business to another company.
            </p>
          </Section>

          <Section title="5. Do We Use Cookies and Other Tracking Technologies?">
            <p>
              <strong className="text-gray-900 dark:text-gray-100">In Short:</strong> We may use
              cookies and other tracking technologies to collect and store your information.
            </p>
            <p>
              We may use cookies and similar tracking technologies (like web beacons and pixels) to
              gather information when you interact with our Services. Some online tracking
              technologies help us maintain the security of our Services and your account, prevent
              crashes, fix bugs, save your preferences, and assist with basic site functions.
            </p>
            <p>
              We also permit third parties and service providers to use online tracking technologies
              on our Services for analytics and advertising. To the extent these online tracking
              technologies are deemed to be a &quot;sale&quot;/&quot;sharing&quot; under applicable
              US state laws, you can opt out as described in the US residents section below.
            </p>
          </Section>

          <Section title="6. How Long Do We Keep Your Information?">
            <p>
              <strong className="text-gray-900 dark:text-gray-100">In Short:</strong> We keep your
              information for as long as necessary to fulfill the purposes outlined in this Privacy
              Notice unless otherwise required by law.
            </p>
            <p>
              We will only keep your personal information for as long as it is necessary for the
              purposes set out in this Privacy Notice, unless a longer retention period is required or
              permitted by law. No purpose in this notice will require us keeping your personal
              information for longer than three (3) months past the termination of the user&apos;s
              account.
            </p>
          </Section>

          <Section title="7. How Do We Keep Your Information Safe?">
            <p>
              <strong className="text-gray-900 dark:text-gray-100">In Short:</strong> We aim to
              protect your personal information through a system of organizational and technical
              security measures.
            </p>
            <p>
              We have implemented appropriate and reasonable technical and organizational security
              measures designed to protect the security of any personal information we process.
              However, despite our safeguards and efforts to secure your information, no electronic
              transmission over the Internet or information storage technology can be guaranteed to be
              100% secure. You should only access the Services within a secure environment.
            </p>
          </Section>

          <Section title="8. Do We Collect Information from Minors?">
            <p>
              <strong className="text-gray-900 dark:text-gray-100">In Short:</strong> We do not
              knowingly collect data from or market to children under 18 years of age.
            </p>
            <p>
              We do not knowingly collect, solicit data from, or market to children under 18 years of
              age, nor do we knowingly sell such personal information. If we learn that personal
              information from users less than 18 years of age has been collected, we will deactivate
              the account and take reasonable measures to promptly delete such data. If you become
              aware of any data we may have collected from children under age 18, please contact us
              at{' '}
              <a
                href="mailto:support@remindertoday.com"
                className="text-[#6498c8] hover:underline"
              >
                support@remindertoday.com
              </a>
              .
            </p>
          </Section>

          <Section title="9. What Are Your Privacy Rights?">
            <p>
              <strong className="text-gray-900 dark:text-gray-100">In Short:</strong> Depending on
              your state of residence in the US or in some regions, such as the EEA, UK, Switzerland,
              and Canada, you have rights that allow you greater access to and control over your
              personal information.
            </p>
            <p>
              In some regions you have certain rights under applicable data protection laws. These may
              include the right to request access and obtain a copy of your personal information, to
              request rectification or erasure, to restrict the processing of your personal
              information, to data portability, and not to be subject to automated decision-making.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-gray-100">
                Withdrawing your consent:
              </strong>{' '}
              If we are relying on your consent to process your personal information, you have the
              right to withdraw your consent at any time by contacting us.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-gray-100">Account Information:</strong> If
              you would at any time like to review or change the information in your account or
              terminate your account, you can log in to your account settings and update your user
              account.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-gray-100">
                Cookies and similar technologies:
              </strong>{' '}
              Most Web browsers are set to accept cookies by default. If you prefer, you can usually
              choose to set your browser to remove cookies and to reject cookies.
            </p>
            <p>
              If you have questions or comments about your privacy rights, you may email us at{' '}
              <a
                href="mailto:support@remindertoday.com"
                className="text-[#6498c8] hover:underline"
              >
                support@remindertoday.com
              </a>
              .
            </p>
          </Section>

          <Section title="10. Controls for Do-Not-Track Features">
            <p>
              Most web browsers and some mobile operating systems and mobile applications include a
              Do-Not-Track (&quot;DNT&quot;) feature or setting you can activate to signal your
              privacy preference not to have data about your online browsing activities monitored and
              collected. At this stage, no uniform technology standard for recognizing and
              implementing DNT signals has been finalized. As such, we do not currently respond to
              DNT browser signals or any other mechanism that automatically communicates your choice
              not to be tracked online.
            </p>
          </Section>

          <Section title="11. Do United States Residents Have Specific Privacy Rights?">
            <p>
              <strong className="text-gray-900 dark:text-gray-100">In Short:</strong> If you are a
              resident of certain US states, you may have the right to request access to and receive
              details about the personal information we maintain about you and how we have processed
              it, correct inaccuracies, get a copy of, or delete your personal information. You may
              also have the right to withdraw your consent to our processing of your personal
              information.
            </p>
            <p>Your rights may include:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Right to know whether or not we are processing your personal data</li>
              <li>Right to access your personal data</li>
              <li>Right to correct inaccuracies in your personal data</li>
              <li>Right to request the deletion of your personal data</li>
              <li>Right to obtain a copy of the personal data you previously shared with us</li>
              <li>Right to non-discrimination for exercising your rights</li>
              <li>
                Right to opt out of the processing of your personal data if it is used for targeted
                advertising, the sale of personal data, or profiling
              </li>
            </ul>
            <p>
              We have not disclosed, sold, or shared any personal information to third parties for a
              business or commercial purpose in the preceding twelve (12) months. We will not sell or
              share personal information in the future belonging to website visitors, users, and other
              consumers.
            </p>
            <p>
              To exercise these rights, you can contact us by emailing{' '}
              <a
                href="mailto:support@remindertoday.com"
                className="text-[#6498c8] hover:underline"
              >
                support@remindertoday.com
              </a>
              .
            </p>
          </Section>

          <Section title="12. Do We Make Updates to This Notice?">
            <p>
              <strong className="text-gray-900 dark:text-gray-100">In Short:</strong> Yes, we will
              update this notice as necessary to stay compliant with relevant laws.
            </p>
            <p>
              We may update this Privacy Notice from time to time. The updated version will be
              indicated by an updated &quot;Revised&quot; date at the top of this Privacy Notice. If
              we make material changes, we may notify you either by prominently posting a notice of
              such changes or by directly sending you a notification.
            </p>
          </Section>

          <Section title="13. How Can You Contact Us About This Notice?">
            <p>
              If you have questions or comments about this notice, you may email us at{' '}
              <a
                href="mailto:support@remindertoday.com"
                className="text-[#6498c8] hover:underline"
              >
                support@remindertoday.com
              </a>{' '}
              or contact us by post at:
            </p>
            <p>ReminderToday</p>
          </Section>

          <Section title="14. How Can You Review, Update, or Delete the Data We Collect from You?">
            <p>
              Based on the applicable laws of your country or state of residence in the US, you may
              have the right to request access to the personal information we collect from you,
              details about how we have processed it, correct inaccuracies, or delete your personal
              information. You may also have the right to withdraw your consent to our processing of
              your personal information. These rights may be limited in some circumstances by
              applicable law. To request to review, update, or delete your personal information,
              please submit a data subject access request.
            </p>
          </Section>

          <p className="text-xs text-gray-400 dark:text-gray-500 pt-4 border-t border-[var(--border)]">
            This Privacy Policy was created using Termly&apos;s Privacy Policy Generator.
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}): ReactNode {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {children}
    </section>
  )
}
