import { should } from "chai";

describe('Test Table (meta-data and data) CRUD', () => {
  // beforeEach(() => {
  //   cy.task('resetDatabase'); // Custom task to clear the DB
  // });
  const url = 'http://frontend-server:5173' || Cypress.env('nodeAppUrl');

  before(() => {
    cy.log('FRONTEND_URL', { url })
    console.log({ FRONTEND_URL: url })
    cy.task('resetDatabaseAuthGroups').then((result) => {
      cy.log('Database reset result:', JSON.stringify(result));
    });
    cy.visit(`${url}/register/user`)

    cy.contains('Username').siblings('input').click().type('User 1')

    cy.contains('Password').siblings('input').click().type('1234567')

    cy.contains('Password Confirmation').siblings('input').click().type('1234567')

    cy.contains('Submit').click()

    //cy.wait(8000)

    cy.get("[data-cy='header']").should('exist')

    cy.contains('Logout').click()


    cy.visit(`${url}/register/admin`);
    cy.get("[data-cy='username-input']").type("Admin 1");
    cy.get("[data-cy='password-input']").type("1234567");
    cy.get("[data-cy='password-confirmation-input']").type("1234567");

    cy.contains('Register').click();


    cy.get("[data-cy='header']").should('exist')
    cy.contains('Logout').click()
  }),
    beforeEach(() => {
      cy.log('FRONTEND_URL', { url })
      cy.visit(`${url}/login`);
      cy.get("[data-cy='username-login-input']").type("Admin 1");
      cy.get("[data-cy='password-login-input']").type("1234567");

      cy.contains('Submit').click();

      cy.contains('Logout')

    })
  it('should associate user to group and group to dashboards', () => {
    cy.log('FRONTEND_URL', { url })
    cy.visit(`${url}/auth/groups`)

    cy.get("[data-cy='edit-on-grid-toggle']").click()

    cy.get(`[data-cy="grid-action-refresh-btn"]`).click()

    cy.contains('Loading...', { timeout: 15000 }).should('not.exist')

    cy.get("[row-index='1'] [col-id='name']").dblclick({ force: true });

    cy.get("[row-index='1'] [col-id='name']").type('Regular User{enter}');

    cy.contains('AuthGroup(s) created!', { timeout: 15000 }).should('exist')

    cy.get(`[data-cy="grid-action-refresh-btn"]`).click()

    cy.get("[data-cy='edit-on-grid-toggle']").click()

    cy.contains('Regular User').siblings('[col-id="click"]').dblclick()

    cy.contains('Regular User Dashboards:').next().find("[data-cy='grid-add-btn']").click();

    cy.contains('Dash 1', { timeout: 15000 }).siblings('[col-id="selection-mode"]').find('input').click()

    cy.contains('Add Group(s)').click()

    cy.contains('Success').should('exist')

    cy.get('body').click('bottomLeft')

    cy.contains('Regular User Dashboards:').next().find("[data-cy='grid-add-btn']").click();

    cy.contains('Dash 2').siblings('[col-id="selection-mode"]').find('input').click()

    cy.contains('Add Group(s)').click()

    cy.contains('Success').should('exist')

    cy.get('body').click('bottomLeft')

    cy.contains('Dash 2').siblings('[col-id="read"]').find('input').click()

    cy.get("[data-cy='grid-action-panel-save-btn']").click()

    cy.contains('Dashboard(s) updated!').should('be.visible')

    cy.contains('Dashboard(s) updated!').should('be.visible')

    cy.wait(2000)

    cy.contains('Dash 1').should('be.visible')

    cy.contains('Dash 2').should('be.visible')

    cy.contains('Dash 2').siblings('[col-id="read"]').find('input').should('be.checked')

    cy.contains('Dash 1').siblings('[col-id="read"]').find('input').should('not.be.checked')

    cy.contains('Regular User Users:').next().find("[data-cy='grid-add-btn']").click();

    cy.contains('User 1').siblings('[col-id="selection-mode"]').find('input').click()

    cy.contains('Add User(s)').click()

    cy.contains('Success').should('exist')

    cy.get('body').click('bottomLeft')

    cy.contains('Logout').click()

    cy.wait(1000)
    cy.visit(`${url}/login`)

    cy.contains('Username').siblings('input').click().type('User 1')

    cy.contains('Password').siblings('input').click().type('1234567')

    cy.contains('Submit').click()

    cy.wait(11000)

    cy.visit(`${url}/dashboards`)

    cy.get('[data-cy="read-tables-aggrid"]').contains('Dash 2').should('be.visible')

    cy.get('[data-cy="read-tables-aggrid"]').contains('Dash 1').should('not.exist')

  })
  //  it('should login as user and see only Dash 2', () => {
  //  })
})
