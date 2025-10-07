import { Fyo } from 'fyo';
import { SalesInvoice } from './SalesInvoice';
import {
  generateEInvoicePayload,
  generateIRN,
  validateEInvoiceData,
  EInvoiceData,
  EInvoiceResponse,
} from './eInvoiceUtils';
import { showDialog } from 'src/utils/interactive';

/**
 * E-Invoice Service for GST Portal Integration
 *
 * This service handles the generation and cancellation of e-Invoices
 * through the GST Portal API (via GSP - GST Suvidha Provider)
 */
export class EInvoiceService {
  private fyo: Fyo;
  private apiEndpoint: string;
  private authToken?: string;

  constructor(fyo: Fyo) {
    this.fyo = fyo;
    // This should be configured in settings
    // For sandbox: https://gsp.adaequare.com/test/enriched/ei/api/
    // For production: https://gsp.adaequare.com/enriched/ei/api/
    this.apiEndpoint = 'https://gsp.adaequare.com/test/enriched/ei/api/';
  }

  /**
   * Generate e-Invoice for a sales invoice
   */
  async generateEInvoice(invoice: SalesInvoice): Promise<EInvoiceResponse> {
    try {
      // Validate invoice data
      const validation = validateEInvoiceData(invoice);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation Failed',
          errorDetails: validation.errors.join(', '),
        };
      }

      // Generate e-Invoice payload
      const eInvoiceData = await generateEInvoicePayload(this.fyo, invoice);

      // Generate IRN locally (for reference)
      const irn = generateIRN(eInvoiceData);

      // In production, this would call the actual GSP API
      // For now, we simulate the response
      const response = await this.callGSPAPI('invoice', eInvoiceData);

      if (response.success) {
        // Update invoice with e-Invoice details
        await invoice.setAndSync({
          eInvoiceGenerated: true,
          irn: response.Irn || irn,
          ackNo: response.AckNo,
          ackDate: response.AckDt ? new Date(response.AckDt) : new Date(),
          signedQrCode: response.SignedQRCode,
        });

        await showDialog({
          title: this.fyo.t`E-Invoice Generated`,
          detail: this.fyo.t`E-Invoice generated successfully. IRN: ${
            response.Irn || irn
          }`,
          type: 'success',
        });
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: 'E-Invoice Generation Failed',
        errorDetails: (error as Error).message,
      };
    }
  }

  /**
   * Cancel e-Invoice
   */
  async cancelEInvoice(
    invoice: SalesInvoice,
    reason: string,
    remark: string
  ): Promise<EInvoiceResponse> {
    try {
      if (!invoice.eInvoiceGenerated) {
        return {
          success: false,
          error: 'No e-Invoice to cancel',
          errorDetails: 'E-Invoice not generated for this invoice',
        };
      }

      if (invoice.eInvoiceCancelled) {
        return {
          success: false,
          error: 'Already Cancelled',
          errorDetails: 'E-Invoice already cancelled',
        };
      }

      // Prepare cancellation payload
      const cancelData = {
        Irn: invoice.irn,
        CnlRsn: reason, // Cancellation Reason Code (1-5)
        CnlRem: remark, // Cancellation Remark
      };

      // Call GSP API to cancel e-Invoice
      const response = await this.callGSPAPI('cancel', cancelData);

      if (response.success) {
        // Update invoice with cancellation details
        await invoice.setAndSync({
          eInvoiceCancelled: true,
          cancelDate: new Date(),
          cancelRemark: remark,
        });

        await showDialog({
          title: this.fyo.t`E-Invoice Cancelled`,
          detail: this.fyo.t`E-Invoice cancelled successfully.`,
          type: 'success',
        });
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: 'E-Invoice Cancellation Failed',
        errorDetails: (error as Error).message,
      };
    }
  }

  /**
   * Get e-Invoice details by IRN
   */
  async getEInvoiceByIRN(irn: string): Promise<EInvoiceResponse> {
    try {
      const response = await this.callGSPAPI('irn', { Irn: irn });
      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch e-Invoice',
        errorDetails: (error as Error).message,
      };
    }
  }

  /**
   * Call GSP API endpoint
   *
   * NOTE: This is a placeholder implementation
   * In production, you need to:
   * 1. Implement proper authentication with GSP
   * 2. Handle API credentials securely
   * 3. Implement proper error handling
   * 4. Add retry logic
   * 5. Handle rate limiting
   */
  private async callGSPAPI(
    endpoint: string,
    data: any
  ): Promise<EInvoiceResponse> {
    // This is a simulated response for development/testing
    // In production, replace with actual API call

    // Example of how the actual API call would look:
    /*
    const response = await fetch(`${this.apiEndpoint}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        'gstin': await this.getGSTIN(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return await response.json();
    */

    // Simulated response for testing
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint === 'invoice') {
          resolve({
            success: true,
            Irn: this.generateMockIRN(),
            AckNo: this.generateMockAckNo(),
            AckDt: new Date().toISOString(),
            SignedQRCode: this.generateMockQRCode(data),
          });
        } else if (endpoint === 'cancel') {
          resolve({
            success: true,
          });
        } else {
          resolve({
            success: true,
            Irn: data.Irn,
          });
        }
      }, 1000); // Simulate network delay
    });
  }

  /**
   * Generate mock IRN for testing
   */
  private generateMockIRN(): string {
    const randomHash = Math.random().toString(36).substring(2, 15);
    return randomHash.toUpperCase().padEnd(64, '0');
  }

  /**
   * Generate mock acknowledgement number for testing
   */
  private generateMockAckNo(): string {
    return Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(12, '0');
  }

  /**
   * Generate mock QR code for testing
   */
  private generateMockQRCode(data: any): string {
    // In production, this would be the actual signed QR code from GSP
    const qrData = JSON.stringify({
      irn: this.generateMockIRN(),
      ackNo: this.generateMockAckNo(),
      ackDt: new Date().toISOString(),
    });
    return Buffer.from(qrData).toString('base64');
  }

  /**
   * Get GSTIN from settings
   */
  private async getGSTIN(): Promise<string> {
    const gstin = (await this.fyo.getValue(
      'AccountingSettings',
      'gstin'
    )) as string;

    if (!gstin) {
      throw new Error('GSTIN not configured in Accounting Settings');
    }

    return gstin;
  }

  /**
   * Authenticate with GSP
   * This should be implemented based on your GSP provider's authentication mechanism
   */
  async authenticate(username: string, password: string): Promise<boolean> {
    try {
      // Implement actual authentication with GSP
      // Store auth token for subsequent requests
      this.authToken = 'mock_token_' + Date.now();
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  /**
   * Download e-Invoice PDF
   */
  async downloadEInvoicePDF(invoice: SalesInvoice): Promise<void> {
    if (!invoice.irn) {
      throw new Error('IRN not available');
    }

    // In production, this would call GSP API to get PDF
    // For now, we just show a message
    await showDialog({
      title: this.fyo.t`Download E-Invoice PDF`,
      detail: this.fyo.t`E-Invoice PDF download feature will be available after GSP integration`,
      type: 'info',
    });
  }
}
