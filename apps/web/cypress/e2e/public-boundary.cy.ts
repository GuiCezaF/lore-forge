describe('public campaign boundary', () => {
  it('does not expose a campaign for an invalid spectator token', () => {
    cy.request({
      url: `${Cypress.env('apiUrl')}/spectator-access/not-a-valid-token`,
      failOnStatusCode: false,
    }).its('status').should('eq', 404);
  });

  it('renders the public route at a mobile viewport', () => {
    cy.viewport('iphone-6');
    cy.visit('/spectate/not-a-valid-token', { failOnStatusCode: false });
    cy.contains(/not found|não encontrado|inválido/i).should('be.visible');
  });
});
