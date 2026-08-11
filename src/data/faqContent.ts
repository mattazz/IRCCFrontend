/**
 * FAQ content tree, ported from IRCCBackend's Telegram bot (app.js's /faq command and
 * callback_query handlers) so the two surfaces stay in sync on wording and sourcing rather
 * than drifting into two independently-maintained copies of immigration guidance. Text is
 * carried over verbatim (formatting adapted for a web page instead of chat messages) -
 * update both places together if the bot's content changes.
 */

export interface FaqNode {
  id: string
  /** Button label used by the parent node to link to this node. Unused for the root. */
  label: string
  /** Shown above this node's content/children, e.g. a question prompting a choice. */
  prompt?: string
  /** Paragraphs of answer text, rendered in order. */
  content?: string[]
  link?: { label: string; url: string }
  children?: FaqNode[]
}

export const faqRoot: FaqNode = {
  id: 'root',
  label: 'FAQ',
  prompt: 'Welcome to the IRCC FAQ! Choose a topic to get started.',
  children: [
    {
      id: 'how',
      label: 'How do I use the FAQ section?',
      content: ['Click on the topics below to navigate through the FAQ sections. More resources will be added in the future.'],
    },
    {
      id: 'ee',
      label: 'Immigrating through Express Entry',
      content: [
        'Express Entry is an online system that IRCC uses to manage immigration applications from skilled workers.',
        'There are 3 main immigration programs managed through Express Entry:\n\n✅ Canadian Experience Class\n✅ Federal Skilled Worker Program\n✅ Federal Skilled Trades Program',
      ],
      link: {
        label: 'Learn more on the official IRCC site',
        url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/works.html',
      },
      children: [
        {
          id: 'ee_req',
          label: 'What are the general requirements for Express Entry?',
          content: [
            'To be eligible for Express Entry, you must meet certain requirements provided by the government.\n\nThese requirements are based on factors such as:\n\n✅ nationality\n✅ age\n✅ language ability\n✅ family members\n✅ education\n✅ work experience\n✅ available funds\n✅ details on any job offer',
            'IRCC provides an eligibility tool where you will be asked certain questions to determine eligibility.',
          ],
          link: {
            label: 'Come to Canada eligibility tool',
            url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/come-canada-tool-immigration-express-entry.html',
          },
        },
        {
          id: 'ee_progs',
          label: 'What are the Express Entry programs available?',
          prompt: 'There are 3 immigration programs managed through Express Entry. Choose one to learn more:',
          content: [
            '✅ Canadian Experience Class\n✅ Federal Skilled Worker Program\n✅ Federal Skilled Trades Program',
          ],
          children: [
            {
              id: 'cec',
              label: 'Canadian Experience Class',
              content: [
                'The Canadian Experience Class is for skilled workers who have Canadian work experience and want to become permanent residents.',
                'To be eligible, you must meet all the minimum requirements for:\n\n✅ Canadian skilled work experience\n✅ language ability',
                'There is no education requirement for the Canadian Experience Class, but you can earn points for education if you have it - whether you went to school in Canada or have foreign education.',
                'You must also be admissible to Canada.',
              ],
              link: {
                label: 'Official IRCC page: Canadian Experience Class',
                url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/canadian-experience-class.html',
              },
            },
            {
              id: 'fsw',
              label: 'Federal Skilled Worker Program',
              content: [
                'The Federal Skilled Worker Program is for skilled workers who have work experience and want to become permanent residents.',
                'In general, you must meet all the minimum requirements for:\n\n✅ skilled work experience\n✅ language ability\n✅ education',
                'Skilled work in TEER 0 / 1 / 2 / 3 (must show proof of work experience), and language ability in English or French (must show proof of language ability).',
                'If you went to school in Canada, you must have a certificate, diploma or degree from a Canadian secondary institution (high school) or post-secondary institution. If you have foreign education, you must have a completed educational credential and an Educational Credential Assessment for immigration purposes from a designated organization.',
              ],
              link: {
                label: 'Official IRCC page: Federal Skilled Worker Program',
                url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/federal-skilled-workers.html',
              },
            },
            {
              id: 'fst',
              label: 'Federal Skilled Trades Program',
              content: [
                'The Federal Skilled Trades Program is for skilled workers who want to become permanent residents based on being qualified in a skilled trade.',
                'In general, you must meet all the minimum requirements for your skilled trades work experience, job offer or certificate of qualification, and language ability.',
                'Skilled trades work experience: at least 2 years of full-time work experience (or an equal amount of part-time work experience) in a skilled trade within the 5 years before you apply, meeting the job requirements for that skilled trade as set out in the National Occupational Classification (NOC), and showing that you performed the actions in the lead statement of the occupational description and most of the main duties listed.',
                'Job offer or certificate of qualification: a valid job offer of full-time employment for a total period of at least 1 year, or a certificate of qualification in your skilled trade issued by a Canadian provincial, territorial or federal authority.',
                'A certificate of qualification proves you’re qualified to work in a certain skilled trade in Canada - meaning you passed a certification exam and meet all the requirements to practise your trade in the province or territory that issued your certificate. It’s issued by the provincial or territorial body that governs trades in their province or territory, or a federal authority.',
                'Language ability in English or French (must show proof of language ability). If you went to school in Canada, you must have a certificate, diploma or degree from a Canadian secondary institution (high school) or post-secondary institution.',
                'You must also show proof of funds to support yourself and your family.',
              ],
              link: {
                label: 'Official IRCC page: Federal Skilled Trades Program',
                url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/skilled-trades.html',
              },
            },
          ],
        },
        {
          id: 'ee_crs',
          label: 'How do I improve my CRS score?',
          content: [
            'As stated on the IRCC website, while you’re in the pool, you can improve your score and increase your chances of being invited to apply by:\n\n✅ getting a valid job offer\n✅ using Job Bank\n✅ promoting yourself to employers in Canada using private-sector job boards\n✅ contacting provinces and territories and asking them to consider you for a Provincial Nominee Program\n✅ improving your language score\n✅ improving your education\n✅ gaining more skilled work experience',
          ],
          link: {
            label: 'Find out more on the IRCC site',
            url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/submit-profile/waiting-pool.html#improve',
          },
        },
      ],
    },
    {
      id: 'pnp',
      label: 'Learn about Provincial Nomination Programs',
      prompt: 'Which Provincial Nomination Program do you want to know more about?',
      children: [
        {
          id: 'alb',
          label: 'Alberta',
          content: [
            'The Alberta Advantage Immigration Program (AAIP) is an economic immigration program that nominates people for permanent residence in Alberta. Nominees must have skills to fill job shortages or be planning to buy or start a business in Alberta. They must also be able to provide for their families. The program is run by the governments of Alberta and Canada.',
            'If you are nominated through the program, you may apply for permanent residence status together with your spouse or common-law partner, and dependent children.',
          ],
          link: { label: 'Alberta Advantage Immigration Program', url: 'https://www.alberta.ca/alberta-advantage-immigration-program' },
        },
        {
          id: 'bc',
          label: 'British Columbia',
          content: [
            'The BC Provincial Nominee Program (BC PNP) is an economic immigration program. It lets the Province select economic immigrants who will live in B.C. and help fill job vacancies or operate businesses.',
            'If you are nominated, you and your family can apply to Immigration, Refugees and Citizenship Canada (IRCC) for permanent residence in Canada.',
          ],
          link: { label: 'BC Provincial Nominee Program', url: 'https://www.welcomebc.ca/immigrate-to-b-c/about-the-bc-provincial-nominee-program' },
        },
        {
          id: 'man',
          label: 'Manitoba',
          content: [
            'The Manitoba Provincial Nominee Program (MPNP) offers three streams, with their respective pathways, through which you can immigrate to the province of Manitoba and become a permanent resident of Canada.',
          ],
          link: { label: 'Manitoba Provincial Nominee Program', url: 'https://www.immigratemanitoba.com/' },
        },
        {
          id: 'nb',
          label: 'New Brunswick',
          content: [
            'New Brunswick’s immigration program streams are pathways to permanent residence (PR) for foreign workers who have the skills, education, and work experience necessary to successfully contribute to New Brunswick’s economy.',
            'When applying to many of these programs, you must be PR ready - meaning you meet all minimum eligibility requirements and have all the required documents on hand to prepare and submit a complete and correct application to the province of New Brunswick and to the Government of Canada.',
          ],
          link: { label: 'New Brunswick immigration program streams', url: 'https://www2.gnb.ca/content/gnb/en/corporate/promo/immigration/immigrating-to-nb/nb-immigration-program-streams.html' },
        },
        {
          id: 'nfl',
          label: 'Newfoundland and Labrador',
          content: [
            'The Newfoundland and Labrador Provincial Nominee Program (NLPNP) is an economic immigration program intended for Newfoundland and Labrador employers with labour market challenges, and skilled workers, international graduates and entrepreneurs interested in settling in Newfoundland and Labrador.',
            'The NLPNP facilitates the immigration of individuals who can make a positive contribution to the province’s economy and who intend to permanently settle with their families in the province. Successful applicants may become permanent residents of Canada.',
          ],
          link: { label: 'Newfoundland and Labrador Provincial Nominee Program', url: 'https://www.gov.nl.ca/immigration/immigrating-to-newfoundland-and-labrador/provincial-nominee-program/overview/' },
        },
        {
          id: 'nt',
          label: 'Northwest Territories',
          content: [
            'To immigrate here through the Northwest Territories Nominee Program, you need to either be ready to open, purchase or invest in a business in the NWT, or have a job offer from an employer in the NWT.',
          ],
          link: { label: 'Northwest Territories Nominee Program', url: 'https://www.immigratenwt.ca/immigrate-here' },
        },
        {
          id: 'ns',
          label: 'Nova Scotia',
          content: [
            'Once you’re ready to move to Nova Scotia, you will want to apply to a Nova Scotia Nominee Program (NSNP) stream. Through the NSNP, prospective immigrants who have the skills and experience needed by Nova Scotia employers may be nominated to immigrate.',
          ],
          link: { label: 'Nova Scotia Nominee Program', url: 'https://liveinnovascotia.com/nova-scotia-nominee-program/' },
        },
        {
          id: 'ont',
          label: 'Ontario',
          content: [
            'The OINP nominates foreign workers, entrepreneurs and international students to the Government of Canada for permanent residence in Ontario.',
            'Ontario’s economic immigration program works in partnership with the Canadian government’s immigration pathways.',
          ],
          link: { label: 'Immigrate to Ontario', url: 'https://www.ontario.ca/page/immigrate-to-ontario' },
        },
        {
          id: 'pei',
          label: 'Prince Edward Island',
          content: [
            'If you are seeking permanent residency in Prince Edward Island, one pathway is to be nominated to the federal government through the PEI Provincial Nominee Program (PNP). Individuals are selected for nomination based on their intention to live and work in PEI and their economic ability to establish here.',
            'At this time, priority will be given to entrepreneurs and to individuals qualified to work in areas with identified skill shortages in the PEI labour market.',
          ],
          link: { label: 'PEI Provincial Nominee Program', url: 'https://www.princeedwardisland.ca/en/information/office-of-immigration/provincial-nominee-program' },
        },
        {
          id: 'qc',
          label: 'Quebec',
          content: ['This program is for people who wish to immigrate to Québec as a skilled worker, whether they are in Québec or abroad.'],
          link: { label: 'Quebec regular skilled worker program', url: 'https://www.quebec.ca/en/immigration/permanent/skilled-workers/regular-skilled-worker-program' },
        },
        {
          id: 'sk',
          label: 'Saskatchewan',
          link: { label: 'Saskatchewan Immigrant Nominee Program', url: 'https://www.saskatchewan.ca/residents/moving-to-saskatchewan/live-in-saskatchewan/by-immigrating/saskatchewan-immigrant-nominee-program' },
        },
        {
          id: 'yk',
          label: 'Yukon',
          content: [
            'The Yukon Nominee Program accepts applications for nominee candidates both inside and outside of Canada. To qualify, you must have a full-time and year-round job offer from an eligible Yukon employer, and meet the specific criteria of your application stream.',
            'To qualify for the Yukon Business Nominee Program, you must meet the eligibility requirements.',
            'You are not eligible if you’re a refugee claimant, or inadmissible to Canada.',
          ],
          link: { label: 'Yukon Nominee Program', url: 'https://yukon.ca/immigrate-yukon' },
        },
      ],
    },
  ],
}
