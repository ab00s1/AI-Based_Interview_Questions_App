// src/components/ui/tabs.jsx
import * as React from "react";

const TabsContext = React.createContext(null);

const Tabs = ({ defaultValue, className, children, ...props }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`w-full ${className || ""}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ className, children, ...props }) => {
  return (
    <div 
      className={`flex flex-row items-center gap-2 border-b ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, className, children, ...props }) => {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      className={`px-4 py-2 font-medium transition-all outline-none ${
        isActive 
          ? "border-b-2 border-blue-600 text-blue-600" 
          : "text-gray-500 hover:text-gray-800"
      } ${className || ""}`}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, className, children, ...props }) => {
  const { activeTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div className={`mt-4 outline-none ${className || ""}`} {...props}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };