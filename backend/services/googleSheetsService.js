const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');

// Initialize Google Sheets API
function getGoogleSheetsClient() {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
    });

    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    throw error;
  }
}

// Get Google Drive client for managing permissions
function getGoogleDriveClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive']
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Create a new Google Sheet or update existing one
 * Dynamically creates investor tracking spreadsheet
 */
async function createOrUpdateSheet({ founderName, investors, strategy, sheetId, update = false }) {
  try {
    const sheets = getGoogleSheetsClient();
    const drive = getGoogleDriveClient();
    let spreadsheetId = sheetId;

    if (!update) {
      // Create new spreadsheet
      const createResponse = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `GetFunded.ai - ${founderName} - Investor Pipeline`,
            locale: 'en_US',
            timeZone: 'America/New_York'
          },
          sheets: [
            {
              properties: {
                title: 'Investors',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 15
                }
              }
            },
            {
              properties: {
                title: 'Strategy',
                gridProperties: {
                  rowCount: 100,
                  columnCount: 5
                }
              }
            },
            {
              properties: {
                title: 'Pipeline Status',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 10
                }
              }
            }
          ]
        }
      });

      spreadsheetId = createResponse.data.spreadsheetId;

      // Make the sheet publicly viewable
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          type: 'anyone',
          role: 'reader'
        }
      });
    }

    // Prepare investor data for sheets
    const investorHeaders = [
      'Status',
      'Name',
      'Firm',
      'Role',
      'Email',
      'LinkedIn',
      'Location',
      'Sectors',
      'Stages',
      'Check Size',
      'Portfolio Highlights',
      'Investment Thesis',
      'Personalized Note',
      'Last Contact',
      'Next Step'
    ];

    const investorData = investors.map(investor => [
      'Not Contacted', // Status
      investor.name || '',
      investor.firm || '',
      investor.role || '',
      investor.email || '',
      investor.linkedIn || '',
      investor.location || '',
      Array.isArray(investor.sectors) ? investor.sectors.join(', ') : investor.sectors || '',
      Array.isArray(investor.stages) ? investor.stages.join(', ') : investor.stages || '',
      investor.checkSize || '',
      Array.isArray(investor.portfolioHighlights) ? investor.portfolioHighlights.join(', ') : investor.portfolioHighlights || '',
      investor.investmentThesis || '',
      '', // Personalized Note (to be filled)
      '', // Last Contact
      '' // Next Step
    ]);

    // Update Investors sheet
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: 'Investors!A1:O1',
            values: [investorHeaders]
          },
          {
            range: 'Investors!A2:O' + (investors.length + 1),
            values: investorData
          }
        ]
      }
    });

    // Format the header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.31,
                    green: 0.27,
                    blue: 0.89
                  },
                  textFormat: {
                    foregroundColor: {
                      red: 1,
                      green: 1,
                      blue: 1
                    },
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 15
              }
            }
          },
          {
            setDataValidation: {
              range: {
                sheetId: 0,
                startRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 1
              },
              rule: {
                condition: {
                  type: 'ONE_OF_LIST',
                  values: [
                    { userEnteredValue: 'Not Contacted' },
                    { userEnteredValue: 'Email Sent' },
                    { userEnteredValue: 'Replied' },
                    { userEnteredValue: 'Meeting Booked' },
                    { userEnteredValue: 'Meeting Completed' },
                    { userEnteredValue: 'Due Diligence' },
                    { userEnteredValue: 'Term Sheet' },
                    { userEnteredValue: 'Not Interested' },
                    { userEnteredValue: 'Not a Fit' }
                  ]
                },
                showCustomUi: true
              }
            }
          }
        ]
      }
    });

    // Add strategy data if provided
    if (strategy && !update) {
      const strategyData = [
        ['Strategy Component', 'Details'],
        ['Target Sectors', Array.isArray(strategy.sectors) ? strategy.sectors.join(', ') : strategy.sectors || ''],
        ['Geographic Focus', strategy.geographicFocus || ''],
        ['Investment Stages', Array.isArray(strategy.stages) ? strategy.stages.join(', ') : strategy.stages || ''],
        ['Investor Types', Array.isArray(strategy.investorTypes) ? strategy.investorTypes.join(', ') : strategy.investorTypes || ''],
        ['Check Size Range', strategy.checkSizeRange || ''],
        ['Key Value Props', Array.isArray(strategy.valuePropositions) ? strategy.valuePropositions.join(', ') : strategy.valuePropositions || '']
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Strategy!A1:B7',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: strategyData
        }
      });
    }

    // Set up Pipeline Status sheet
    const pipelineHeaders = [
      'Investor',
      'Firm',
      'Status',
      'Last Updated',
      'Days Since Contact',
      'Response Rate',
      'Notes'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Pipeline Status!A1:G1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [pipelineHeaders]
      }
    });

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    
    console.log('✅ Google Sheet created/updated successfully:', sheetUrl);
    
    return {
      spreadsheetId,
      sheetUrl,
      investorCount: investors.length
    };
  } catch (error) {
    console.error('Error creating/updating Google Sheet:', error);
    throw error;
  }
}

/**
 * Update specific cells in the sheet
 */
async function updateSheetCell(spreadsheetId, range, value) {
  try {
    const sheets = getGoogleSheetsClient();
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[value]]
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating sheet cell:', error);
    throw error;
  }
}

/**
 * Get data from sheet
 */
async function getSheetData(spreadsheetId, range) {
  try {
    const sheets = getGoogleSheetsClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });
    
    return response.data.values;
  } catch (error) {
    console.error('Error getting sheet data:', error);
    throw error;
  }
}

/**
 * Batch update investor statuses
 */
async function updateInvestorStatuses(spreadsheetId, updates) {
  try {
    const sheets = getGoogleSheetsClient();
    
    // Get current data to find investor rows
    const currentData = await getSheetData(spreadsheetId, 'Investors!A:O');
    
    const updateRequests = updates.map(update => {
      const rowIndex = currentData.findIndex(row => row[4] === update.email) + 1; // Email is in column E (index 4)
      
      if (rowIndex > 0) {
        return {
          range: `Investors!A${rowIndex}`,
          values: [[update.status]]
        };
      }
      return null;
    }).filter(Boolean);
    
    if (updateRequests.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updateRequests
        }
      });
    }
    
    return { success: true, updated: updateRequests.length };
  } catch (error) {
    console.error('Error updating investor statuses:', error);
    throw error;
  }
}

module.exports = {
  createOrUpdateSheet,
  updateSheetCell,
  getSheetData,
  updateInvestorStatuses
};
