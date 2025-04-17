import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../AuthContext"
import { Card, CardContent, Input, Switch, Button, Select } from "../components/components"

const SettingsView = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { i18n, t } = useTranslation();
  const [language, setLanguage] = useState(localStorage.getItem('language'))
  const handleLanguageChange = (event) => {
    console.log({ event })
    const selectedLanguage = event
    localStorage.setItem('language', event)
    i18n.changeLanguage(selectedLanguage);
  };


  if (!isAuthenticated) return navigate('/unauthorized')

  return (
    <div className="settings-container">
      <h1 className="settings-title">Settings</h1>
      <div className="settings-grid">
        <Card className="settings-card">
          <CardContent>
            <h2>Profile</h2>
            <label>
              {t('Name')}
              <Input type="text" placeholder="Enter your name" />
            </label>
            <label>
              Email
              <Input type="email" placeholder="Enter your email" />
            </label>
          </CardContent>
        </Card>
        <Card className="settings-card">
          <CardContent>
            <h2>{t('Preferences')}</h2>
            <label className="switch-container">
              Dark Mode
              <Switch />
            </label>
            <label className="switch-container">
              Notifications
              <Switch />
            </label>
            <Select value={language} onChange={handleLanguageChange} options={[{ value: 'en', label: 'English' }, { value: 'ptBr', label: 'Português' }]}>
            </Select>
          </CardContent>
        </Card>
        <Card className="settings-card full-width">
          <CardContent>
            <h2>Account</h2>
            <Button variant="destructive">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div >
  );
}

export default SettingsView
