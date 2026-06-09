---
source: Confluence "1D - 2. VCIP (Personal Identification)", получено 2026-06-09
type: исходник (raw, verbatim)
---

# 1D - 2. VCIP (Personal Identification)

# Definition
As per RBI Master Direction:
**Video based Customer Identification Process (V-CIP)** — is an alternate method of customer identification with facial recognition and customer due diligence by an authorised official of the RE by undertaking seamless, secure, live, informed-consent based audio-visual interaction with the customer to obtain identification information required for CDD purpose, and to ascertain the veracity of the information furnished by the customer through independent verification and maintaining audit trail of the process. Such processes complying with prescribed standards and procedures shall be treated on par with face-to-face CIP for the purpose of this Master Direction.

# Conditions to undertake V-CIP
As per RBI Master Direction (https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12089&Mode=0)

**V-CIP Infrastructure**
1. The technology infrastructure should be housed in own premises of the RE and the V-CIP connection and interaction shall necessarily originate from its own secured network domain. Any technology related outsourcing for the process should be compliant with relevant RBI guidelines.
2. The RE shall ensure end-to-end encryption of data between customer device and the hosting point of the V-CIP application, as per appropriate encryption standards. The customer consent should be recorded in an auditable and alteration proof manner.
3. The V-CIP infrastructure / application should be capable of preventing connection from IP addresses outside India or from spoofed IP addresses.
4. The video recordings should contain the live GPS co-ordinates (geo-tagging) of the customer undertaking the V-CIP and date-time stamp. The quality of the live video in the V-CIP shall be adequate to allow identification of the customer beyond doubt.
5. The application shall have components with face liveness / spoof detection as well as face matching technology with high degree of accuracy, even though the ultimate responsibility of any customer identification rests with the RE. Appropriate AI technology can be used to ensure that the V-CIP is robust.
6. Based on experience of detected / attempted / 'near-miss' cases of forged identity, the technology infrastructure including application software as well as work flows shall be regularly upgraded. Any detected case of forged identity through V-CIP shall be reported as a cyber security event under extant regulatory guidelines.
7. The V-CIP infrastructure shall undergo necessary tests such as Vulnerability Assessment, Penetration testing and a Security Audit to ensure its robustness and end-to-end encryption capabilities. Any critical gap shall be mitigated before rollout. Tests by accredited agencies as prescribed by RBI, periodically.
8. The V-CIP application software and relevant APIs / webservices shall also undergo appropriate testing of functional, performance, maintenance strength before being used in live environment. Only after closure of any critical gap should the application be rolled out. Periodic tests too.

**2. V-CIP Procedure**
1. Each RE shall formulate a clear work flow and SOP for V-CIP and ensure adherence. The V-CIP process shall be operated only by officials of the RE specially trained. The official should be capable to carry out liveliness check and detect fraudulent manipulation or suspicious conduct and act upon it.
2. If there is a disruption in the V-CIP procedure, the same should be aborted and a fresh session initiated.
3. The sequence and/or type of questions, including those indicating the liveness of the interaction, shall be varied to establish that interactions are real-time and not pre-recorded.
4. Any prompting, observed at end of customer shall lead to rejection of the account opening process.
5. The fact of the V-CIP customer being an existing or new customer, or if it relates to a case rejected earlier or if the name appearing in some negative list should be factored in at appropriate stage of work flow.
6. The authorised official performing the V-CIP shall record audio-video as well as capture photograph of the customer and obtain the identification information using any one of: OTP based Aadhaar e-KYC authentication; Offline Verification of Aadhaar; KYC records downloaded from CKYCR (Section 56, using KYC identifier); Equivalent e-document of OVDs including documents issued through DigiLocker.
7. RE shall ensure to redact or blackout the Aadhaar number in terms of Section 16.
8. If the address of the customer is different from that indicated in the OVD, suitable records of the current address shall be captured. Economic and financial profile/information submitted shall be confirmed from the customer during V-CIP.
9. RE shall capture a clear image of PAN card to be displayed by the customer during the process, except where e-PAN is provided. PAN details verified from the database of the issuing authority including through DigiLocker.
10. Use of printed copy of equivalent e-document including e-PAN is not valid for the V-CIP.
11. The authorised official shall ensure that photograph of the customer in the Aadhaar/OVD and PAN/e-PAN matches with the customer undertaking the V-CIP and identification details match with details provided.
12. Assisted V-CIP shall be permissible when banks take help of Banking Correspondents (BCs) facilitating the process only at the customer end. Banks shall maintain details of the BC. Ultimate responsibility for CDD is with the bank.
13. All accounts opened through V-CIP shall be made operational only after being subject to concurrent audit, to ensure the integrity of process and acceptability of outcome.
14. All matters not specified but required under other statutes such as the IT Act shall be appropriately complied with.

**3. V-CIP Records and Data Management**
1. The entire data and recordings of V-CIP shall be stored in a system / systems located in India. Video recording stored safely & securely with date/time stamp for easy historical data search. Extant record management instructions apply.
2. The activity log along with credentials of the official performing the V-CIP shall be preserved.

# Self VKYC Business Process - 1D - 2.1. Self VKYC Business Process
(см. файл 2.1-Self-VKYC-Business-Process.md)

> Прим.: в коде/прототипе для facial recognition рассматривается Sber **SmartBio SDK** (live liveness checks). См. дублирующую расширенную версию страницы в analytics-and-research.md → "Копия 1D - 2. VCIP" (там детальный пошаговый VCIP + Officer-assisted scenario с действиями VKYC Officer).
